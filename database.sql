CREATE DATABASE IF NOT EXISTS jee_quiz;
USE jee_quiz;

-- Table to store all quiz questions (The Source of Truth)
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    correct_answer CHAR(1) NOT NULL -- 'A', 'B', 'C', or 'D'
);

-- Table to store student results (The Answer Sheet)
-- The raw_answers field stores a JSON string of all user inputs and question details for review
CREATE TABLE results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    total_score INT NOT NULL,
    date_taken DATETIME DEFAULT CURRENT_TIMESTAMP,
    raw_answers JSON NOT NULL -- Stores detailed JSON of the attempt for checking
);

-- Sample JEE Level Questions (Physics, Chemistry, Maths)

-- Physics
INSERT INTO questions (subject, question_text, option_a, option_b, option_c, option_d, correct_answer) VALUES
('Physics', 'A parallel plate capacitor is charged to a potential difference $V$. If the plates are moved apart, the capacitance $C$ and potential difference $V$ will change to:', 'C decreases, V increases', 'C increases, V decreases', 'C and V both increase', 'C and V both decrease', 'A'),
('Physics', 'If the magnetic flux linked with a coil changes by $8 \\times 10^{-2}$ Wb in $0.2$ s, the induced EMF is:', '$0.4$ V', '$0.04$ V', '$4$ V', '$40$ V', 'A'),
('Physics', 'The effective resistance between points A and B in the circuit shown (each resistor is $R$) is: $$ \\begin{tikzpicture} \\draw (0,0) node[circ](A){A} -- (2,0) to[R](2,2) -- (0,2) to[R](0,0); \\draw (2,2) -- (4,2) to[R](4,0) -- (2,0); \\draw (4,0) node[circ](B){B}; \\end{tikzpicture} $$', '$R$', '$R/2$', '$2R$', '$3R/2$', 'B');

-- Chemistry
INSERT INTO questions (subject, question_text, option_a, option_b, option_c, option_d, correct_answer) VALUES
('Chemistry', 'The number of unpaired electrons in a $d^6$ ion in an octahedral field is:', '5', '4', '2', '0', 'B'),
('Chemistry', 'Which of the following compounds has the highest $\\text{p}K_a$ value?', 'Acetic Acid', 'Phenol', 'Ethanol', 'Benzoic Acid', 'C'),
('Chemistry', 'The solubility product ($K_{sp}$) of $\\text{AgCl}$ is $1.6 \\times 10^{-10}$. What is the molar solubility of $\\text{AgCl}$ in $0.01$ M $\\text{NaCl}$ solution?', '$1.6 \\times 10^{-12}$ M', '$1.6 \\times 10^{-8}$ M', '$1.6 \\times 10^{-10}$ M', '$1.6 \\times 10^{-5}$ M', 'B');

-- Maths
INSERT INTO questions (subject, question_text, option_a, option_b, option_c, option_d, correct_answer) VALUES
('Maths', 'If $A$ is a square matrix of order $3$ such that $\\text{adj}(A) = 4$, then $|A|$ is equal to:', '$4$ or $-4$', '$4$', '$2$', '$-2$', 'A'),
('Maths', 'The value of the integral $\\int_{0}^{\\frac{\\pi}{2}} \\frac{\\sqrt{\\sin x}}{\\sqrt{\\sin x} + \\sqrt{\\cos x}} dx$ is:', '$0$', '$1$', '$\\frac{\\pi}{2}$', '$\\frac{\\pi}{4}$', 'D'),
('Maths', 'The area bounded by the curve $y = 2x - x^2$ and the line $y = x$ is:', '$\\frac{1}{6}$ sq. units', '$\\frac{1}{3}$ sq. units', '$\\frac{1}{2}$ sq. units', '$\\frac{5}{6}$ sq. units', 'A');
