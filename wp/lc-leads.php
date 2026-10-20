<?php
/**
 * Plugin Name: Learn Crew — lead capture
 * Description: POST /wp-json/lc/v1/lead. Stores tool leads with WhatsApp consent evidence, plus a Tools submenu to read and export them.
 * Version:     1.1.0
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
// Indian mobile carriers put thousands of phones behind one shared IPv4 (CGNAT),
// so a per-IP limit has to leave room for a classroom's worth of real students
// on one address during an Instagram push. 20 per fixed ten-minute window still
// stops a script; 5 on a sliding window locked busy carrier IPs out for good.
const LC_LEADS_RATE_MAX     = 20;   // posts per IP per window
const LC_LEADS_RATE_WINDOW  = 600;  // seconds
const LC_LEADS_PAYLOAD_MAX  = 4096; // chars of encoded JSON kept
const LC_LEADS_PER_PAGE     = 50;

// Whitelists for the soft gate. Anything else is dropped, never stored as typed.
const LC_LEADS_STREAMS = array(
	'MBA'   => 'MBA',
	'MCA'   => 'MCA',
	'MTECH' => 'M.Tech',
	'CAT'   => 'CAT',
	'MAT'   => 'MAT',
);
const LC_LEADS_SEGMENTS = array(
	'2027_FINAL_YEAR'           => '2027 aspirant (student)',
	'2027_WORKING_PRO_REPEATER' => '2027 aspirant (working / repeater)',
	'2026_ADMITTED_FRESHER'     => 'Joining college now (2026)',
);

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

	// Fixed window. A sliding one restarts the clock on every post, so a shared
	// carrier IP that keeps receiving real submissions never comes back out.
	$now_ts = time();
	$window = get_transient( $key );
	if ( ! is_array( $window ) || ! isset( $window['n'], $window['t'] ) || $now_ts - (int) $window['t'] >= LC_LEADS_RATE_WINDOW ) {
		$window = array( 'n' => 0, 't' => $now_ts );
	}
	if ( (int) $window['n'] >= LC_LEADS_RATE_MAX ) {
		return new WP_Error(
			'lc_rate_limited',
			'Too many submissions from this connection. Try again in a few minutes.',
			array( 'status' => 429 )
		);
	}
	$window['n'] = (int) $window['n'] + 1;
	set_transient( $key, $window, max( 1, LC_LEADS_RATE_WINDOW - ( $now_ts - (int) $window['t'] ) ) );

	// Honeypot. People never see the field, bots fill everything. Answer as if it
	// worked and store nothing, so the bot has no signal to tune against.
	$honeypot = $request->get_param( 'website' );
	if ( ! empty( $honeypot ) ) {
		return new WP_REST_Response( array( 'ok' => true ), 200 );
	}

	// A lead needs one way to reach the student: a WhatsApp number, an email, or
	// both. The soft gate asks for WhatsApp only, the PDF gates ask for email; a
	// lead with neither is useless and is refused. Whatever IS supplied must be valid.
	$email_raw = trim( (string) $request->get_param( 'email' ) );
	$email     = '' === $email_raw ? '' : sanitize_email( $email_raw );
	if ( '' !== $email_raw && ! is_email( $email ) ) {
		return new WP_Error( 'lc_bad_email', 'Enter a valid email address.', array( 'status' => 400 ) );
	}

	// Indian mobiles are 10 digits; 13 covers +91 with the country code typed in.
	$phone = preg_replace( '/\D/', '', (string) $request->get_param( 'phone' ) );
	if ( '' !== $phone && ( strlen( $phone ) < 10 || strlen( $phone ) > 13 ) ) {
		return new WP_Error( 'lc_bad_phone', 'Enter a valid mobile number.', array( 'status' => 400 ) );
	}

	if ( '' === $email && '' === $phone ) {
		return new WP_Error( 'lc_no_contact', 'Enter your WhatsApp number or email.', array( 'status' => 400 ) );
	}

	// Stream and segment come from fixed dropdowns. Unknown values are dropped
	// rather than stored, so the sheet never fills with free text from a bot.
	$stream_in = preg_replace( '/[^A-Z]/', '', strtoupper( (string) $request->get_param( 'stream' ) ) );
	$stream    = isset( LC_LEADS_STREAMS[ $stream_in ] ) ? $stream_in : '';
	$segment_in = preg_replace( '/[^A-Z0-9_]/', '', strtoupper( (string) $request->get_param( 'segment' ) ) );
	$segment    = isset( LC_LEADS_SEGMENTS[ $segment_in ] ) ? $segment_in : '';

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
	$name    = substr( sanitize_text_field( (string) $request->get_param( 'name' ) ), 0, 120 );
	$consent = rest_sanitize_boolean( $request->get_param( 'whatsappConsent' ) );
	$now     = current_time( 'mysql', true );

	// Where the visitor came from. The tools app attaches this to every lead; a
	// direct API caller may omit it, so every field is optional and sanitised.
	$attr_in = $request->get_param( 'attribution' );
	$attr    = array();
	if ( is_array( $attr_in ) ) {
		foreach ( array( 'channel', 'gclid', 'gbraid', 'wbraid', 'utmSource', 'utmMedium', 'utmCampaign', 'utmTerm', 'firstSeen', 'firstReferrer', 'landingPage' ) as $k ) {
			if ( isset( $attr_in[ $k ] ) && is_scalar( $attr_in[ $k ] ) ) {
				$attr[ $k ] = substr( sanitize_text_field( (string) $attr_in[ $k ] ), 0, 300 );
			}
		}
	}

	// Keep who and where with the lead in the database too, so the CSV export and
	// any later re-push to the sheet still carry them. The table has no name
	// column and the live schema is not worth migrating for it, so name, stream
	// and segment ride in the payload under _lead, beside _attribution. Before
	// this the name only ever reached the sheet — a failed push lost it for good.
	$extras = array();
	$lead_meta = array_filter(
		array( 'name' => $name, 'stream' => $stream, 'segment' => $segment ),
		'strlen'
	);
	if ( $lead_meta ) {
		$extras['_lead'] = $lead_meta;
	}
	if ( $attr ) {
		$extras['_attribution'] = $attr;
	}
	$payload_json = lc_leads_merge_payload( $payload_json, $extras );

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
			'attr'    => $attr,
			'stream'  => $stream,
			'segment' => $segment,
		)
	);

	return new WP_REST_Response( array( 'ok' => true ), 201 );
}

/**
 * Add keys to the stored payload JSON without ever truncating it mid-string.
 *
 * substr() on encoded JSON lands mid-token and the stored value stops parsing,
 * which defeats keeping it for the export. If the tool inputs and the extras do
 * not both fit, the extras (who, where from) are the more useful half and win.
 */
function lc_leads_merge_payload( $payload_json, array $extras ) {
	if ( ! $extras ) {
		return $payload_json;
	}
	$merged = is_string( $payload_json ) ? json_decode( $payload_json, true ) : array();
	$merged = is_array( $merged ) ? $merged : array();
	foreach ( $extras as $k => $v ) {
		$merged[ $k ] = $v;
	}
	$encoded = wp_json_encode( $merged, 0, 8 );
	if ( is_string( $encoded ) && strlen( $encoded ) <= LC_LEADS_PAYLOAD_MAX ) {
		return $encoded;
	}
	$only = wp_json_encode( $extras, 0, 8 );
	if ( is_string( $only ) && strlen( $only ) <= LC_LEADS_PAYLOAD_MAX ) {
		return $only;
	}
	return $payload_json;
}

/** Name, stream and segment back out of a stored payload, for the admin screen and export. */
function lc_leads_meta( $payload_json ) {
	$p    = is_string( $payload_json ) ? json_decode( $payload_json, true ) : null;
	$meta = ( is_array( $p ) && isset( $p['_lead'] ) && is_array( $p['_lead'] ) ) ? $p['_lead'] : array();
	return array(
		'name'    => isset( $meta['name'] ) ? (string) $meta['name'] : '',
		'stream'  => isset( $meta['stream'] ) ? (string) $meta['stream'] : '',
		'segment' => isset( $meta['segment'] ) ? (string) $meta['segment'] : '',
	);
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

	// The student's own answer beats a guess from the tool slug.
	if ( ! empty( $lead['stream'] ) && isset( LC_LEADS_STREAMS[ $lead['stream'] ] ) ) {
		$label  = LC_LEADS_STREAMS[ $lead['stream'] ];
		$course = ( 'PGCET' === $course ) ? 'PGCET ' . $label : $label;
	}

	// Email now has its own column on the mailing-list tab, so Remarks carries the
	// context a caller needs instead — segment first, because it decides the pitch.
	$remarks = $lead['tool'];
	if ( ! empty( $lead['segment'] ) && isset( LC_LEADS_SEGMENTS[ $lead['segment'] ] ) ) {
		$remarks = LC_LEADS_SEGMENTS[ $lead['segment'] ] . ' | ' . $remarks;
	}
	if ( $lead['consent'] ) {
		$remarks .= ' | WhatsApp opt-in';
	}
	$inputs = json_decode( (string) $lead['payload'], true );
	if ( is_array( $inputs ) && $inputs ) {
		$bits = array();
		unset( $inputs['_lead'], $inputs['_attribution'] );
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
					// The paid-vs-organic answer. 'unknown' only when the visitor
					// arrived before this shipped, or with storage blocked.
					'channel' => isset( $lead['attr']['channel'] ) ? $lead['attr']['channel'] : 'unknown',
					'gclid'   => isset( $lead['attr']['gclid'] ) ? $lead['attr']['gclid'] : '',
					'utm_source'   => isset( $lead['attr']['utmSource'] ) ? $lead['attr']['utmSource'] : '',
					'utm_medium'   => isset( $lead['attr']['utmMedium'] ) ? $lead['attr']['utmMedium'] : '',
					'utm_campaign' => isset( $lead['attr']['utmCampaign'] ) ? $lead['attr']['utmCampaign'] : '',
					'landing_page' => isset( $lead['attr']['landingPage'] ) ? $lead['attr']['landingPage'] : '',
					// The sheet's Page column — which tool produced the lead.
					'page'    => $lead['tool'],
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
	foreach ( array( 'ID', 'Received (UTC)', 'Name', 'Email', 'Phone', 'Tool', 'Stream / segment', 'WhatsApp', 'Consent at', 'IP', 'Payload' ) as $heading ) {
		echo '<th>' . esc_html( $heading ) . '</th>';
	}
	echo '</tr></thead><tbody>';

	if ( ! $rows ) {
		echo '<tr><td colspan="11">No leads yet.</td></tr>';
	}
	foreach ( (array) $rows as $row ) {
		$meta = lc_leads_meta( $row->payload );
		echo '<tr>';
		echo '<td>' . esc_html( $row->id ) . '</td>';
		echo '<td>' . esc_html( $row->created_at ) . '</td>';
		echo '<td>' . esc_html( $meta['name'] ) . '</td>';
		echo '<td>' . esc_html( $row->email ) . '</td>';
		echo '<td>' . esc_html( $row->phone ) . '</td>';
		echo '<td>' . esc_html( $row->tool ) . '</td>';
		echo '<td>' . esc_html( trim( $meta['stream'] . ' ' . ( isset( LC_LEADS_SEGMENTS[ $meta['segment'] ] ) ? LC_LEADS_SEGMENTS[ $meta['segment'] ] : '' ) ) ) . '</td>';
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
		// name, stream and segment are appended at the end, never inserted, so
		// anything already reading this export by column position keeps working.
		fputcsv( $out, array( 'id', 'created_at_utc', 'email', 'phone', 'tool', 'whatsapp_consent', 'consent_at_utc', 'ip', 'payload', 'name', 'stream', 'segment' ) );
		foreach ( (array) $rows as $row ) {
			$meta = lc_leads_meta( $row['payload'] );
			$line = array_merge( array_values( $row ), array( $meta['name'], $meta['stream'], $meta['segment'] ) );
			fputcsv( $out, array_map( 'lc_leads_csv_cell', $line ) );
		}
		fclose( $out );
		exit;
	}
);
