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

// 1. Get POST data
$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

if (!$data || !isset($data['studentName'], $data['subject'], $data['submittedAnswers'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
    exit();
}

$student_name = $data['studentName'];
$subject = $data['subject'];
$submitted_answers = $data['submittedAnswers']; // Array of { id: qId, selected: answer }

// Extract question IDs to fetch correct answers
$question_ids = array_map(function($ans) { return $ans['id']; }, $submitted_answers);
if (empty($question_ids)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "No answers submitted."]);
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
    // 3. Fetch correct answers securely from the DB
    $placeholders = implode(',', array_fill(0, count($question_ids), '?'));
    $sql = "SELECT id, correct_answer FROM questions WHERE id IN ($placeholders)";
    
    $stmt = $conn->prepare($sql);
    $types = str_repeat('i', count($question_ids)); // 'i' for integer type
    $stmt->bind_param($types, ...$question_ids);
    $stmt->execute();
    $result = $stmt->get_result();
    $correct_answers_map = [];

    while ($row = $result->fetch_assoc()) {
        $correct_answers_map[$row['id']] = $row['correct_answer'];
    }
    $stmt->close();

    // 4. Scoring Logic (+4 right, -1 wrong, 0 unattempted)
    $total_score = 0;
    $detailed_answers = [];

    foreach ($submitted_answers as $submission) {
        $q_id = $submission['id'];
        $selected_option = isset($submission['selected']) ? $submission['selected'] : null;
        $correct_option = $correct_answers_map[$q_id] ?? null;

        $marks = 0;
        $is_correct = false;

        if ($selected_option !== null && $correct_option !== null) {
            // Attempted
            if ($selected_option === $correct_option) {
                $marks = 4;
                $is_correct = true;
            } else {
                $marks = -1;
                $is_correct = false;
            }
        }
        // If selected_option is null, it was unattempted, marks = 0

        $total_score += $marks;

        $detailed_answers[] = [
            'question_id' => $q_id,
            'selected_option' => $selected_option,
            'correct_option' => $correct_option,
            'is_correct' => $is_correct,
            'marks_obtained' => $marks
        ];
    }

    // 5. Save the result to the database
    $raw_answers_json = json_encode($detailed_answers);
    $insert_sql = "INSERT INTO results (student_name, subject, total_score, raw_answers) VALUES (?, ?, ?, ?)";
    $stmt_insert = $conn->prepare($insert_sql);
    $stmt_insert->bind_param("siss", $student_name, $subject, $total_score, $raw_answers_json);
    $stmt_insert->execute();
    $new_result_id = $conn->insert_id;
    $stmt_insert->close();


    // 6. Send the result back to the client
    echo json_encode([
        "success" => true,
        "resultId" => $new_result_id,
        "studentName" => $student_name,
        "subject" => $subject,
        "totalScore" => $total_score,
        "detailedAnswers" => $detailed_answers // Send the detailed answers back for immediate display
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "An error occurred during scoring: " . $e->getMessage()]);
}

$conn->close();
?>
