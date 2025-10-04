<?php
// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "carwash_booking";

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Check if all required fields are provided
if (!isset($input['username']) || !isset($input['email']) || !isset($input['password']) || 
    !isset($input['full_name']) || !isset($input['phone'])) {
    echo json_encode(["error" => "Incomplete data"]);
    exit();
}

$username = $input['username'];
$email = $input['email'];
$password = password_hash($input['password'], PASSWORD_DEFAULT);
$full_name = $input['full_name'];
$phone = $input['phone'];

try {
    // Check if username or email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(["error" => "Username or email already exists"]);
        exit();
    }
    
    // Insert new user
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password, full_name, phone, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
    $stmt->execute([$username, $email, $password, $full_name, $phone]);
    
    echo json_encode(["message" => "User registered successfully"]);
    
} catch(PDOException $e) {
    echo json_encode(["error" => "Registration failed: " . $e->getMessage()]);
}
?>
