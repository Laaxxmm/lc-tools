<?php
/**
 * Plugin Name: Learn Crew — lead capture
 * Description: POST /wp-json/lc/v1/lead. Stores tool leads with WhatsApp consent evidence, plus a Tools submenu to read and export them.
 * Version:     1.0.0
 * Author:      Learn Crew
 *
 * Drop this file in wp-content/mu-plugins/. Must-use plugins load on every request
 * and cannot be deactivated from the dashboard, which is what we want for the one
 * endpoint the static /tools/ pages depend on.
 *
 * The static export at learncrew.org/tools/ cannot accept a POST. WordPress can, it is
 * the same origin so there is no CORS to configure, and the leads land in the database
 * you already back up. No third party holds student contact details.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const LC_LEADS_DB_VERSION   = '1';
const LC_LEADS_MAX_BODY     = 8192; // bytes
const LC_LEADS_RATE_MAX     = 5;    // posts per IP
const LC_LEADS_RATE_WINDOW  = 600;  // seconds
const LC_LEADS_PAYLOAD_MAX  = 4096; // chars of encoded JSON kept
const LC_LEADS_PER_PAGE     = 50;

function lc_leads_table() {
	global $wpdb;
	return $wpdb->prefix . 'lc_leads';
}

/**
 * Create or upgrade the table.
 *
 * register_activation_hook never fires for a must-use plugin, so the usual
 * activation pattern would silently never run. An autoloaded option compare on
 * plugins_loaded costs no query and is the standard replacement.
 */
function lc_leads_install() {
	if ( get_option( 'lc_leads_db_version' ) === LC_LEADS_DB_VERSION ) {
		return;
	}

	global $wpdb;
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';

	$table   = lc_leads_table();
	$charset = $wpdb->get_charset_collate();

	// dbDelta is whitespace-sensitive: one field per line, two spaces after PRIMARY KEY.
	dbDelta(
		"CREATE TABLE $table (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			email varchar(190) NOT NULL,
			phone varchar(20) NOT NULL DEFAULT '',
			tool varchar(80) NOT NULL DEFAULT '',
			payload longtext NULL,
			whatsapp_consent tinyint(1) NOT NULL DEFAULT 0,
			consent_at datetime NULL DEFAULT NULL,
			ip varchar(45) NOT NULL DEFAULT '',
			created_at datetime NOT NULL,
			PRIMARY KEY  (id),
			KEY email (email),
			KEY tool (tool),
			KEY created_at (created_at)
		) $charset;"
	);

	update_option( 'lc_leads_db_version', LC_LEADS_DB_VERSION, true );
}
add_action( 'plugins_loaded', 'lc_leads_install' );

/**
 * REMOTE_ADDR only. X-Forwarded-For is supplied by the caller, so trusting it would
 * let anyone clear their own rate limit by inventing a header. If Cloudflare ever
 * fronts this domain, switch to CF-Connecting-IP and nothing else.
 */
function lc_leads_client_ip() {
	$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? wp_unslash( $_SERVER['REMOTE_ADDR'] ) : '';
	$ip = filter_var( $ip, FILTER_VALIDATE_IP );
	return $ip ? $ip : '';
}

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'lc/v1',
			'/lead',
			array(
				'methods'             => 'POST',
				'callback'            => 'lc_leads_handle',
				// Public form. Anyone may post; the checks in the handler are the gate.
				'permission_callback' => '__return_true',
			)
		);
	}
);

function lc_leads_handle( WP_REST_Request $request ) {
	if ( strlen( $request->get_body() ) > LC_LEADS_MAX_BODY ) {
		return new WP_Error( 'lc_too_large', 'That submission was too large.', array( 'status' => 413 ) );
	}

	$ip  = lc_leads_client_ip();
	$key = 'lc_lead_rl_' . md5( $ip );

	$hits = (int) get_transient( $key );
	if ( $hits >= LC_LEADS_RATE_MAX ) {
		return new WP_Error(
			'lc_rate_limited',
			'Too many submissions from this connection. Try again in a few minutes.',
			array( 'status' => 429 )
		);
	}
	// Sliding window: each post restarts the ten minutes. Stricter than a fixed
	// window and one line shorter.
	set_transient( $key, $hits + 1, LC_LEADS_RATE_WINDOW );

	// Honeypot. People never see the field, bots fill everything. Answer as if it
	// worked and store nothing, so the bot has no signal to tune against.
	$honeypot = $request->get_param( 'website' );
	if ( ! empty( $honeypot ) ) {
		return new WP_REST_Response( array( 'ok' => true ), 200 );
	}

	$email = sanitize_email( (string) $request->get_param( 'email' ) );
	if ( ! is_email( $email ) ) {
		return new WP_Error( 'lc_bad_email', 'Enter a valid email address.', array( 'status' => 400 ) );
	}

	// Indian mobiles are 10 digits; 13 covers +91 with the country code typed in.
	$phone = preg_replace( '/\D/', '', (string) $request->get_param( 'phone' ) );
	if ( '' !== $phone && ( strlen( $phone ) < 10 || strlen( $phone ) > 13 ) ) {
		return new WP_Error( 'lc_bad_phone', 'Enter a valid mobile number.', array( 'status' => 400 ) );
	}

	$tool = sanitize_key( (string) $request->get_param( 'tool' ) );

	$payload      = $request->get_param( 'payload' );
	$payload_json = null;
	if ( is_array( $payload ) && $payload ) {
		$encoded      = wp_json_encode( $payload, 0, 8 );
		$payload_json = is_string( $encoded ) ? substr( $encoded, 0, LC_LEADS_PAYLOAD_MAX ) : null;
	}

	// DPDP wants provable consent, and the WhatsApp Business API bans senders who
	// message without prior opt-in. Boolean alone is not evidence, so the timestamp
	// and the IP are stored with it and the timestamp stays NULL when consent is not given.
	$name    = sanitize_text_field( (string) $request->get_param( 'name' ) );
	$consent = rest_sanitize_boolean( $request->get_param( 'whatsappConsent' ) );
	$now     = current_time( 'mysql', true );

	global $wpdb;
	$inserted = $wpdb->insert(
		lc_leads_table(),
		array(
			'email'            => $email,
			'phone'            => $phone,
			'tool'             => $tool,
			'payload'          => $payload_json,
			'whatsapp_consent' => $consent ? 1 : 0,
			'consent_at'       => $consent ? $now : null,
			'ip'               => $ip,
			'created_at'       => $now,
		),
		array( '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%s' )
	);

	if ( false === $inserted ) {
		return new WP_Error( 'lc_store_failed', 'Could not save right now. Please try again.', array( 'status' => 500 ) );
	}

	// The database is the record. The sheet is where the team works, so push a copy
	// there — but only after the row is safely stored, and never let a webhook
	// failure turn into a lost lead or a visible error.
	lc_leads_push_to_sheet(
		array(
			'name'    => $name,
			'email'   => $email,
			'phone'   => $phone,
			'tool'    => $tool,
			'payload' => $payload_json,
			'consent' => $consent,
		)
	);

	return new WP_REST_Response( array( 'ok' => true ), 201 );
}

/**
 * Append the lead to the All Leads sheet via the Apps Script webhook.
 *
 * Fire-and-forget: a five second timeout, failures logged and swallowed. The
 * lead is already in the database by this point, so the worst case is a row
 * missing from the sheet, never a lost lead or a form that appears broken.
 */
function lc_leads_push_to_sheet( array $lead ) {
	if ( ! defined( 'LC_SHEET_WEBHOOK_URL' ) || ! defined( 'LC_SHEET_SECRET' ) ) {
		return; // Not configured yet — the database write already succeeded.
	}

	// The sheet's Course column, inferred from which tool captured the lead.
	$course = 'MBA entrance';
	if ( false !== strpos( $lead['tool'], 'pgcet' ) ) {
		$course = 'PGCET';
	} elseif ( false !== strpos( $lead['tool'], 'mat' ) && false === strpos( $lead['tool'], 'cat-mat' ) ) {
		$course = 'MAT';
	} elseif ( false !== strpos( $lead['tool'], 'cat' ) ) {
		$course = 'CAT / MAT';
	}

	// Email now has its own column on the mailing-list tab, so Remarks carries the
	// context a caller needs instead.
	$remarks = $lead['tool'];
	if ( $lead['consent'] ) {
		$remarks .= ' | WhatsApp opt-in';
	}
	$inputs = json_decode( (string) $lead['payload'], true );
	if ( is_array( $inputs ) && $inputs ) {
		$bits = array();
		foreach ( array_slice( $inputs, 0, 4, true ) as $k => $v ) {
			if ( is_scalar( $v ) ) {
				$bits[] = $k . '=' . $v;
			}
		}
		if ( $bits ) {
			$remarks .= ' | ' . implode( ', ', $bits );
		}
	}

	$res = wp_remote_post(
		LC_SHEET_WEBHOOK_URL,
		array(
			'timeout'  => 5,
			'blocking' => true,
			'headers'  => array( 'Content-Type' => 'application/json' ),
			'body'     => wp_json_encode(
				array(
					'secret'  => LC_SHEET_SECRET,
					'source'  => 'tools',
					'course'  => $course,
					'name'    => $lead['name'],
					'phone'   => $lead['phone'],
					'email'   => $lead['email'],
					'consent' => $lead['consent'] ? true : false,
					'remarks' => $remarks,
				)
			),
		)
	);

	if ( is_wp_error( $res ) ) {
		error_log( '[lc-leads] sheet push failed: ' . $res->get_error_message() );
	}
}

/* -------------------------------------------------------------------------
 * wp-admin: Tools -> Learn Crew leads
 * ---------------------------------------------------------------------- */

add_action(
	'admin_menu',
	function () {
		add_submenu_page(
			'tools.php',
			'Learn Crew leads',
			'Learn Crew leads',
			'manage_options',
			'lc-leads',
			'lc_leads_admin_page'
		);
	}
);

function lc_leads_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'You do not have permission to view leads.' );
	}

	global $wpdb;
	$table = lc_leads_table(); // built from $wpdb->prefix, never from input

	$paged  = isset( $_GET['paged'] ) ? max( 1, (int) $_GET['paged'] ) : 1;
	$offset = ( $paged - 1 ) * LC_LEADS_PER_PAGE;

	$total = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$table}" );
	$rows  = $wpdb->get_results(
		$wpdb->prepare( "SELECT * FROM {$table} ORDER BY id DESC LIMIT %d OFFSET %d", LC_LEADS_PER_PAGE, $offset )
	);
	$pages = max( 1, (int) ceil( $total / LC_LEADS_PER_PAGE ) );

	$export = wp_nonce_url( admin_url( 'admin-post.php?action=lc_leads_export' ), 'lc_leads_export' );

	echo '<div class="wrap">';
	echo '<h1 class="wp-heading-inline">Learn Crew leads</h1> ';
	echo '<a class="page-title-action" href="' . esc_url( $export ) . '">Export CSV</a>';
	echo '<p>' . esc_html( number_format_i18n( $total ) ) . ' leads. WhatsApp consent is only valid where a timestamp is recorded beside it.</p>';

	echo '<table class="wp-list-table widefat fixed striped"><thead><tr>';
	foreach ( array( 'ID', 'Received (UTC)', 'Email', 'Phone', 'Tool', 'WhatsApp', 'Consent at', 'IP', 'Payload' ) as $heading ) {
		echo '<th>' . esc_html( $heading ) . '</th>';
	}
	echo '</tr></thead><tbody>';

	if ( ! $rows ) {
		echo '<tr><td colspan="9">No leads yet.</td></tr>';
	}
	foreach ( (array) $rows as $row ) {
		echo '<tr>';
		echo '<td>' . esc_html( $row->id ) . '</td>';
		echo '<td>' . esc_html( $row->created_at ) . '</td>';
		echo '<td>' . esc_html( $row->email ) . '</td>';
		echo '<td>' . esc_html( $row->phone ) . '</td>';
		echo '<td>' . esc_html( $row->tool ) . '</td>';
		echo '<td>' . ( $row->whatsapp_consent ? 'Yes' : 'No' ) . '</td>';
		echo '<td>' . esc_html( (string) $row->consent_at ) . '</td>';
		echo '<td>' . esc_html( $row->ip ) . '</td>';
		echo '<td><code>' . esc_html( (string) $row->payload ) . '</code></td>';
		echo '</tr>';
	}
	echo '</tbody></table>';

	if ( $pages > 1 ) {
		echo '<p class="tablenav-pages">' . paginate_links(
			array(
				'base'      => add_query_arg( 'paged', '%#%' ),
				'format'    => '',
				'current'   => $paged,
				'total'     => $pages,
				'prev_text' => '&laquo;',
				'next_text' => '&raquo;',
			)
		) . '</p>';
	}

	echo '</div>';
}

/**
 * A leading =, +, - or @ makes Excel and Sheets treat the cell as a formula, so a
 * lead who types one into a form gets code execution on whoever opens the export.
 * Prefixing an apostrophe kills it.
 */
function lc_leads_csv_cell( $value ) {
	$value = (string) $value;
	if ( '' !== $value && false !== strpos( "=+-@\t\r", $value[0] ) ) {
		return "'" . $value;
	}
	return $value;
}

add_action(
	'admin_post_lc_leads_export',
	function () {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'You do not have permission to export leads.' );
		}
		check_admin_referer( 'lc_leads_export' );

		global $wpdb;
		$table = lc_leads_table();
		// Columns listed explicitly and in header order — SELECT * returns table
		// order, which would silently shift every value one column left.
		$rows  = $wpdb->get_results(
			"SELECT id, created_at, email, phone, tool, whatsapp_consent, consent_at, ip, payload FROM {$table} ORDER BY id ASC",
			ARRAY_A
		);

		nocache_headers();
		header( 'Content-Type: text/csv; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename=lc-leads-' . gmdate( 'Y-m-d' ) . '.csv' );

		$out = fopen( 'php://output', 'w' );
		fputcsv( $out, array( 'id', 'created_at_utc', 'email', 'phone', 'tool', 'whatsapp_consent', 'consent_at_utc', 'ip', 'payload' ) );
		foreach ( (array) $rows as $row ) {
			fputcsv( $out, array_map( 'lc_leads_csv_cell', array_values( $row ) ) );
		}
		fclose( $out );
		exit;
	}
);
