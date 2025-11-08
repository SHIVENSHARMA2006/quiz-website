// --- Configuration & Global State ---
// IMPORTANT: The API base URL is crucial. Change 'http://localhost/' if your XAMPP is configured differently. 
const API_BASE_URL = 'http://localhost/';         
let currentSubject = '';
let currentQuestions = [];
let currentStudentName = '';

// --- Utility Functions ---

/** Shows only one section and hides all others */
function showSection(sectionId) {
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
    // Re-render MathJax content if a new section is shown (especially the result sheet)
    if (window.MathJax) {
        MathJax.typesetPromise(); 
    }
}

/** Shows a temporary message */
function showMessage(type, text) {
    const container = document.getElementById('message-container');
    container.classList.remove('hidden');
    
    // Use the dynamic styles defined in styles.css for the message container
    container.innerHTML = `<div style="padding: 15px; border-radius: 8px; margin-bottom: 20px; color: white; background-color: ${type === 'error' ? '#f44336' : '#4CAF50'};">${text}</div>`;
    
    setTimeout(() => container.classList.add('hidden'), 5000);
}

/** Shows/hides loading spinner */
function toggleLoading(isLoading) {
    document.getElementById('loading-container').classList.toggle('hidden', !isLoading);
    // When loading, ensure the primary container is hidden to prevent overlap
    document.querySelector('.container').classList.toggle('hidden', isLoading); 
    // Re-show the container when loading finishes
    if (!isLoading) {
         document.querySelector('.container').classList.remove('hidden');
    }
}

/** Renders MathJax formulas in the given element */
function renderMath(element) {
    if (window.MathJax) {
        MathJax.typesetPromise([element]);
    }
}

// --- Navigation and Setup ---

function openStudentDetails(subject) {
    currentSubject = subject;
    document.getElementById('details-subject-heading').textContent = `Starting ${subject} Quiz`;
    document.getElementById('student-name-input').value = currentStudentName; // Keep name if already entered
    showSection('details-section');
}

// --- Quiz Flow: Start Quiz ---
async function startQuiz() {
    currentStudentName = document.getElementById('student-name-input').value.trim();
    if (!currentStudentName) {
        showMessage('error', 'Please enter your name to begin the quiz.');
        return;
    }

    toggleLoading(true);

    try {
        // 1. Fetch questions from the secure PHP API
        const response = await fetch(`${API_BASE_URL}api_start_quiz.php?subject=${currentSubject}`);
        
        // Handle HTTP error responses
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.success) {
            currentQuestions = data.questions;
            renderQuizForm();
            showSection('quiz-section');
            document.getElementById('quiz-heading').textContent = `${currentSubject} Quiz - Welcome, ${currentStudentName}`;
        } else {
            showMessage('error', data.message || 'Failed to load questions.');
            showSection('home-section');
        }

    } catch (error) {
        showMessage('error', 'Network error. Make sure XAMPP is running and the PHP file exists. Details: ' + error.message);
        console.error('Fetch error:', error);
        showSection('home-section');
    } finally {
        toggleLoading(false);
    }
}

/** Dynamically generates the quiz questions form */
function renderQuizForm() {
    const form = document.getElementById('quiz-form');
    form.innerHTML = ''; // Clear previous questions

    currentQuestions.forEach((q, index) => {
        const block = document.createElement('div');
        block.className = 'question-block';
        
        // Question text (wrapped in p for MathJax to render LaTeX)
        const qText = document.createElement('p');
        qText.innerHTML = `Q${index + 1}. ${q.question_text}`;
        block.appendChild(qText);

        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'options';

        ['A', 'B', 'C', 'D'].forEach(optionKey => {
            const optionValue = q[`option_${optionKey.toLowerCase()}`];
            
            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `question_${q.id}`;
            input.value = optionKey;
            
            const span = document.createElement('span');
            span.innerHTML = optionValue;

            label.appendChild(input);
            label.appendChild(span);
            optionsDiv.appendChild(label);
        });

        block.appendChild(optionsDiv);
        form.appendChild(block);

        // Render MathJax for this specific block
        renderMath(block);
    });
}

// --- Quiz Flow: Submit Quiz ---
async function submitQuiz() {
    toggleLoading(true);

    const form = document.getElementById('quiz-form');
    const formData = new FormData(form);
    const submittedAnswers = [];

    // Extract selected answers from the form
    for (let [name, value] of formData.entries()) {
        if (name.startsWith('question_')) {
            const qId = parseInt(name.replace('question_', ''));
            submittedAnswers.push({ id: qId, selected: value });
        }
    }
    
    // Add unattempted questions (those not in formData) with null answers
    currentQuestions.forEach(q => {
        if (!submittedAnswers.some(ans => ans.id === q.id)) {
            submittedAnswers.push({ id: q.id, selected: null });
        }
    });

    const payload = {
        studentName: currentStudentName,
        subject: currentSubject,
        submittedAnswers: submittedAnswers
    };

    try {
        // 2. Send answers to the secure PHP API for scoring
        const response = await fetch(`${API_BASE_URL}api_submit_quiz.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.success) {
            renderResultSheet(data);
            showSection('result-section');
            showMessage('success', 'Quiz submitted and graded successfully!');
        } else {
            showMessage('error', data.message || 'Failed to submit quiz for scoring.');
            showSection('home-section');
        }

    } catch (error) {
        showMessage('error', 'Network error. Could not connect to the backend scoring server. Details: ' + error.message);
        console.error('Submission error:', error);
        showSection('home-section');
    } finally {
        toggleLoading(false);
    }
}

/** Dynamically renders the final score and answer sheet */
function renderResultSheet(resultData) {
    document.getElementById('result-subject').textContent = resultData.subject;
    document.getElementById('result-student-name').textContent = resultData.studentName;
    document.getElementById('result-score').textContent = `${resultData.totalScore}`;
    
    const answerKeyDiv = document.getElementById('answer-key');
    answerKeyDiv.innerHTML = '';

    resultData.detailedAnswers.forEach((answer, index) => {
        const qId = answer.question_id;
        // Find the original question text from the client-side question array (it only has Q ID and options)
        const originalQuestion = currentQuestions.find(q => q.id === qId);

        if (!originalQuestion) return; 

        const item = document.createElement('div');
        item.className = 'answer-key-item';
        
        // Dynamic background colors for feedback
        item.style.backgroundColor = answer.is_correct ? '#f1fbf1' : (answer.selected_option ? '#fff3f3' : '#fcfcfc');
        item.style.borderColor = answer.is_correct ? '#28a745' : (answer.selected_option ? '#dc3545' : '#ccc');
        
        // Question Text
        const qText = document.createElement('p');
        qText.innerHTML = `<strong>Q${index + 1}.</strong> ${originalQuestion.question_text}`;
        item.appendChild(qText);

        // Scoring Summary
        const scoreInfo = document.createElement('p');
        scoreInfo.innerHTML = `<strong>Marks:</strong> <span style="color: ${answer.marks_obtained > 0 ? '#28a745' : (answer.marks_obtained < 0 ? '#dc3545' : '#888')}">${answer.marks_obtained}</span>`;
        item.appendChild(scoreInfo);
        
        // Your Selection
        const userSelection = document.createElement('p');
        userSelection.className = 'your-selection';
        if (answer.selected_option) {
            const selectedValue = originalQuestion[`option_${answer.selected_option.toLowerCase()}`] || 'N/A';
            userSelection.innerHTML = `<strong>Your Selection:</strong> ${answer.selected_option}. ${selectedValue}`;
        } else {
            userSelection.innerHTML = `<strong>Your Selection:</strong> Unattempted`;
        }
        item.appendChild(userSelection);

        // Correct Answer (from the secure backend response)
        const correctAnswer = document.createElement('p');
        correctAnswer.className = 'correct-answer';
        const correctValue = originalQuestion[`option_${answer.correct_option.toLowerCase()}`] || 'N/A';
        correctAnswer.innerHTML = `<strong>Correct Answer:</strong> ${answer.correct_option}. ${correctValue}`;
        item.appendChild(correctAnswer);

        answerKeyDiv.appendChild(item);
        
        // Re-render MathJax for the new result item
        renderMath(item);
    });
}

// --- View Previous Results ---
async function viewPreviousResults() {
    const studentName = document.getElementById('prev-result-name-input').value.trim();
    if (!studentName) {
        showMessage('error', 'Please enter a student name to view past results.');
        return;
    }

    toggleLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}api_get_results.php?studentName=${encodeURIComponent(studentName)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.success) {
            renderPreviousResults(studentName, data.results);
            showSection('previous-results-section');
        } else {
            showMessage('error', data.message || 'Failed to fetch previous results.');
            showSection('home-section');
        }
    } catch (error) {
        showMessage('error', 'Network error. Could not connect to the backend. Details: ' + error.message);
        console.error('Fetch error:', error);
        showSection('home-section');
    } finally {
        toggleLoading(false);
    }
}

function renderPreviousResults(name, results) {
    document.getElementById('prev-results-student-name').textContent = name;
    const ul = document.getElementById('previous-results-list');
    ul.innerHTML = '';

    if (results.length === 0) {
        ul.innerHTML = '<li style="border-left: 5px solid #ffc107; background-color: #fff3cd; color: #856404;">No previous results found for this student.</li>';
        return;
    }

    results.forEach(result => {
        const li = document.createElement('li');
        const date = new Date(result.date_taken).toLocaleString();
        
        li.innerHTML = `<strong>${result.subject}</strong> Quiz on ${date} | <strong>Score: ${result.total_score}</strong>`;
        
        ul.appendChild(li);
    });
}

// Initial load: Ensure the home section is visible when the script loads
window.onload = () => showSection('home-section');
