<?php
// CORS Headers (Allows your HTML file on localhost to access this script)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Database Configuration
$servername = "localhost";
$username = "root"; // Default XAMPP username
$password = "";     // Default XAMPP password
$dbname = "jee_quiz";

// Set a fixed number of questions to pull
$QUESTION_COUNT = 3; // Use 15 for the final project, 3 for testing

// --- Main Logic ---

// Get subject from GET request (e.g., ?subject=Physics)
$subject = isset($_GET['subject']) ? $_GET['subject'] : null;

if (!$subject) {
    echo json_encode(["success" => false, "message" => "Subject not specified."]);
    exit();
}

// 1. Connect to Database
$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

try {
    // 2. Fetch all questions for the subject
    $stmt = $conn->prepare("SELECT id, subject, question_text, option_a, option_b, option_c, option_d FROM questions WHERE subject = ?");
    $stmt->bind_param("s", $subject);
    $stmt->execute();
    $result = $stmt->get_result();
    $all_questions = [];

    while ($row = $result->fetch_assoc()) {
        $all_questions[] = $row;
    }

    if (empty($all_questions)) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "No questions found for subject: " . $subject]);
        exit();
    }

    // 3. Randomize the questions
    shuffle($all_questions);

    // 4. Select the desired number of questions (e.g., 15)
    $quiz_questions = array_slice($all_questions, 0, $QUESTION_COUNT);

    // 5. Send the questions to the client (CORRECT ANSWERS ARE NOT SENT FOR SECURITY)
    echo json_encode(["success" => true, "questions" => $quiz_questions]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "An error occurred: " . $e->getMessage()]);
}

$conn->close();
?>
