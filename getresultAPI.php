<?php
// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Database Configuration
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "jee_quiz";

// --- Main Logic ---

// 1. Get student name from GET request
$student_name = isset($_GET['studentName']) ? $_GET['studentName'] : null;

if (!$student_name) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Student name not provided."]);
    exit();
}

// 2. Connect to Database
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

try {
    // 3. Fetch all results for the student, ordered by date
    $sql = "SELECT id, student_name, subject, total_score, date_taken FROM results WHERE student_name = ? ORDER BY date_taken DESC";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $student_name);
    $stmt->execute();
    $result = $stmt->get_result();
    $results_list = [];

    while ($row = $result->fetch_assoc()) {
        $results_list[] = $row;
    }

    // 4. Send the results to the client
    echo json_encode(["success" => true, "results" => $results_list]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "An error occurred fetching results: " . $e->getMessage()]);
}

$conn->close();
?>
