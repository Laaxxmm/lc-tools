<?php
/**
 * Runs lc_leads_handle() against stubbed WordPress. Run: php wp/lc-leads.test.php
 *
 * This file is the trust boundary for every lead the tools collect, and it
 * ships by hand into mu-plugins, so a mistake here is invisible until leads
 * stop arriving. These checks fail loudly instead.
 */
define( 'ABSPATH', __DIR__ . '/' );
define( 'LC_SHEET_WEBHOOK_URL', 'https://example.test/exec' );
define( 'LC_SHEET_SECRET', 'S' );

$GLOBALS['__transients'] = array();
$GLOBALS['__posts']      = array();
$GLOBALS['__now']        = 1700000000;

function add_action( $h, $f, $p = 10, $a = 1 ) {}
function get_option( $k ) { return '1'; }
function update_option( $k, $v, $a = null ) {}
function register_rest_route( ...$a ) {}
function wp_unslash( $v ) { return $v; }
function sanitize_email( $e ) { return filter_var( trim( $e ), FILTER_SANITIZE_EMAIL ); }
function is_email( $e ) { return (bool) filter_var( $e, FILTER_VALIDATE_EMAIL ); }
function sanitize_text_field( $s ) { return trim( preg_replace( '/[\r\n\t ]+/', ' ', strip_tags( (string) $s ) ) ); }
function sanitize_key( $s ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( (string) $s ) ); }
function wp_json_encode( $d, $o = 0, $depth = 512 ) { return json_encode( $d, $o, $depth ); }
function rest_sanitize_boolean( $v ) { return in_array( $v, array( true, 'true', '1', 1, 'on' ), true ); }
function current_time( $t, $gmt = 0 ) { return gmdate( 'Y-m-d H:i:s', $GLOBALS['__now'] ); }
function get_transient( $k ) { return $GLOBALS['__transients'][ $k ] ?? false; }
function set_transient( $k, $v, $ttl ) { $GLOBALS['__transients'][ $k ] = $v; }
function is_wp_error( $x ) { return $x instanceof WP_Error; }
function wp_remote_post( $url, $args ) { $GLOBALS['__posts'][] = json_decode( $args['body'], true ); return array( 'response' => array( 'code' => 200 ) ); }
function error_log_( $m ) {}

class WP_Error {
	public $code; public $data;
	function __construct( $code, $msg, $data ) { $this->code = $code; $this->data = $data; }
}
class WP_REST_Response {
	public $data; public $status;
	function __construct( $d, $s ) { $this->data = $d; $this->status = $s; }
}
class WP_REST_Request {
	private $p;
	function __construct( $p ) { $this->p = $p; }
	function get_param( $k ) { return $this->p[ $k ] ?? null; }
	function get_body() { return json_encode( $this->p ); }
}
class FakeDB {
	public $prefix = 'wp_'; public $rows = array();
	function insert( $t, $row, $f ) { $this->rows[] = $row; return 1; }
}
$GLOBALS['wpdb'] = new FakeDB();
$_SERVER['REMOTE_ADDR'] = '203.0.113.7';

require __DIR__ . '/lc-leads.php';

$fails = 0;
function check( $label, $cond ) {
	global $fails;
	echo ( $cond ? 'ok  ' : 'FAIL ' ) . $label . "\n";
	if ( ! $cond ) { $fails++; }
}
function post( array $p, $ip = '203.0.113.7' ) {
	$_SERVER['REMOTE_ADDR'] = $ip;
	$GLOBALS['wpdb']->rows = array();
	$GLOBALS['__posts']    = array();
	return lc_leads_handle( new WP_REST_Request( $p ) );
}
function status( $r ) { return $r instanceof WP_Error ? $r->data['status'] : $r->status; }
function code( $r ) { return $r instanceof WP_Error ? $r->code : 'ok'; }

// 1. Soft gate: WhatsApp only, no email — accepted.
$r = post( array( 'name' => 'Asha R', 'phone' => '98450 12345', 'tool' => 'pgcet-college-predictor',
	'stream' => 'MBA', 'segment' => '2027_FINAL_YEAR', 'whatsappConsent' => true ), '198.51.100.1' );
check( 'phone-only lead accepted (201)', 201 === status( $r ) );
$row = $GLOBALS['wpdb']->rows[0] ?? array();
check( 'stored email is empty string, not NULL', '' === ( $row['email'] ?? null ) );
check( 'stored phone is digits only', '9845012345' === ( $row['phone'] ?? '' ) );
$pl = json_decode( $row['payload'] ?? 'null', true );
check( 'name kept in DB via payload._lead', 'Asha R' === ( $pl['_lead']['name'] ?? '' ) );
check( 'stream + segment kept in DB', 'MBA' === ( $pl['_lead']['stream'] ?? '' ) && '2027_FINAL_YEAR' === ( $pl['_lead']['segment'] ?? '' ) );
check( 'consent timestamp recorded', ! empty( $row['consent_at'] ) && 1 === $row['whatsapp_consent'] );
$sheet = $GLOBALS['__posts'][0] ?? array();
check( 'sheet Course = PGCET MBA (stream beats slug guess)', 'PGCET MBA' === ( $sheet['course'] ?? '' ) );
check( 'sheet Remarks lead with the segment', 0 === strpos( $sheet['remarks'] ?? '', '2027 aspirant (student) | pgcet-college-predictor' ) );
check( 'sheet email blank, no Email List row needed', '' === ( $sheet['email'] ?? 'x' ) );

// 2. Neither phone nor email — refused.
$r = post( array( 'name' => 'Nobody', 'tool' => 'x' ), '198.51.100.2' );
check( 'no contact at all -> 400 lc_no_contact', 400 === status( $r ) && 'lc_no_contact' === code( $r ) );

// 3. Email-only still works (the existing PDF gates).
$r = post( array( 'email' => 'a@b.co', 'tool' => 'mba-cost-and-roi-calculator' ), '198.51.100.3' );
check( 'email-only lead accepted (201)', 201 === status( $r ) );

// 4. Supplied-but-invalid is refused, even with the other field valid.
$r = post( array( 'email' => 'nope', 'phone' => '9845012345', 'tool' => 'x' ), '198.51.100.4' );
check( 'bad email + good phone -> 400 lc_bad_email', 'lc_bad_email' === code( $r ) );
$r = post( array( 'phone' => '12345', 'tool' => 'x' ), '198.51.100.5' );
check( 'short phone -> 400 lc_bad_phone', 'lc_bad_phone' === code( $r ) );

// 5. Whitelists: unknown stream / segment dropped, never stored as typed.
$r   = post( array( 'phone' => '9845012345', 'tool' => 'x', 'stream' => '<script>', 'segment' => 'DROP TABLE' ), '198.51.100.6' );
$pl  = json_decode( $GLOBALS['wpdb']->rows[0]['payload'] ?? 'null', true );
check( 'unknown stream/segment dropped', 201 === status( $r ) && ! isset( $pl['_lead']['stream'] ) && ! isset( $pl['_lead']['segment'] ) );
$r  = post( array( 'phone' => '9845012345', 'tool' => 'x', 'stream' => 'mtech' ), '198.51.100.7' );
$pl = json_decode( $GLOBALS['wpdb']->rows[0]['payload'] ?? 'null', true );
check( 'stream is case-insensitive (mtech -> MTECH)', 'MTECH' === ( $pl['_lead']['stream'] ?? '' ) );

// 6. Honeypot still answers ok and stores nothing.
$r = post( array( 'phone' => '9845012345', 'tool' => 'x', 'website' => 'http://spam' ), '198.51.100.8' );
check( 'honeypot: 200, nothing stored', 200 === status( $r ) && ! $GLOBALS['wpdb']->rows );

// 7. Tool inputs + attribution + _lead all survive in one payload; inputs summary skips extras.
$r  = post( array( 'phone' => '9845012345', 'name' => 'Ravi', 'tool' => 'pgcet-college-predictor',
	'payload' => array( 'rank' => 4200, 'category' => 'GM' ), 'attribution' => array( 'channel' => 'google-ads' ) ), '198.51.100.9' );
$pl = json_decode( $GLOBALS['wpdb']->rows[0]['payload'] ?? 'null', true );
check( 'inputs, _lead and _attribution coexist', 4200 === ( $pl['rank'] ?? 0 ) && 'Ravi' === ( $pl['_lead']['name'] ?? '' ) && 'google-ads' === ( $pl['_attribution']['channel'] ?? '' ) );
$rem = $GLOBALS['__posts'][0]['remarks'] ?? '';
check( 'remarks show inputs, not the _lead/_attribution blobs', false !== strpos( $rem, 'rank=4200' ) && false === strpos( $rem, '_lead' ) );

// 8. Oversized inputs: extras win, payload stays valid JSON.
$big = array( 'blob' => str_repeat( 'x', 5000 ) );
$out = lc_leads_merge_payload( json_encode( $big ), array( '_lead' => array( 'name' => 'Z' ) ) );
check( 'over-cap merge keeps valid JSON with _lead', is_array( json_decode( $out, true ) ) && 'Z' === json_decode( $out, true )['_lead']['name'] );

// 9. Fixed window: 20 allowed, 21st refused, and the window does NOT restart on each post.
$GLOBALS['__transients'] = array();
$codes = array();
for ( $i = 0; $i < 21; $i++ ) {
	$codes[] = status( post( array( 'phone' => '9845012345', 'tool' => 'x' ), '192.0.2.50' ) );
}
check( '20 posts accepted from one IP', 20 === count( array_filter( array_slice( $codes, 0, 20 ), fn( $c ) => 201 === $c ) ) );
check( '21st refused with 429', 429 === $codes[20] );
$GLOBALS['__now'] += 601;   // window elapses even though posts kept arriving
// time() is used by the limiter; emulate the clock by rewriting the stored start.
$k = 'lc_lead_rl_' . md5( '192.0.2.50' );
$GLOBALS['__transients'][ $k ]['t'] -= 601;
check( 'window expires on schedule -> accepted again', 201 === status( post( array( 'phone' => '9845012345', 'tool' => 'x' ), '192.0.2.50' ) ) );

// 10. meta helper used by admin + CSV.
$m = lc_leads_meta( json_encode( array( '_lead' => array( 'name' => 'N', 'stream' => 'MCA' ) ) ) );
check( 'lc_leads_meta reads name/stream, blank segment', 'N' === $m['name'] && 'MCA' === $m['stream'] && '' === $m['segment'] );

echo $fails ? "\n$fails FAILED\n" : "\nall checks passed\n";
exit( $fails ? 1 : 0 );
