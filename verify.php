<?php

require_once('config.php');

// the thing being verified
define('VERIFY_FIELD_EMAIL', 0);
define('VERIFY_FIELD_RESET_PASSWORD', 1);

function verify_email($user, $username, $email) {
  global $base_url, $conn;

  $code = generate_verification_code($user, VERIFY_FIELD_EMAIL);
  $link = $base_url . "?verify=$code";
  $contents = <<<EMAIL
<html>
  <body style="font-family: sans-serif;">
    <h3>Welcome to SquadCal, $username!</h3>
    <p>
      Please complete your registration and verify your email by
      clicking this link: <a href="$link">$link</a>
    </p>
  </body>
</html>
EMAIL;
  mail(
    $email,
    'Verify email for SquadCal',
    $contents,
    "From: no-reply@squadcal.org\r\n".
      "MIME-Version: 1.0\r\n".
      "Content-type: text/html; charset=iso-8859-1\r\n"
  );
}

// generates row in verifications table with hash of code
// returns verification code
function generate_verification_code($user, $field) {
  global $conn;
  $code = bin2hex(openssl_random_pseudo_bytes(4));
  $hash = hash('sha512', $code);
  $time = round(microtime(true) * 1000); // in milliseconds
  $conn->query(
    "INSERT INTO verifications(user, field, hash, creation_time) ".
      "VALUES($user, $field, UNHEX('$hash'), $time)"
  );
  return $code;
}

// deletes the row in verifications table and returns array(user id, field)
// if code doesn't work then returns null
function verify_code($code) {
  global $conn, $verify_code_lifetime;

  $hash = hash('sha512', $code);
  $result = $conn->query(
    "SELECT user, field, creation_time ".
      "FROM verifications WHERE hash = UNHEX('$hash')"
  );
  $row = $result->fetch_assoc();
  if (!$row) {
    return null;
  }

  $time = round(microtime(true) * 1000); // in milliseconds
  if ($row['creation_time'] + $verify_code_lifetime * 1000 < $time) {
    // Code is expired. Delete it...
    $conn->query("DELETE FROM verifications WHERE hash = UNHEX('$hash')");
    return null;
  }

  $user = $row['user'];
  $field = $row['field'];
  // Delete all verifications since it's verified now
  $conn->query(
    "DELETE FROM verifications WHERE user = $user AND field = $field"
  );
  return array($user, $field);
}
