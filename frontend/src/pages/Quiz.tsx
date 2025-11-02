import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, CheckCircle } from "lucide-react";

// Mock data for the quiz. This can be fetched from an API.
// The key is that it's an array, so the number of questions isn't fixed.
const quizQuestions = [
  {
    id: 1,
    question: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "High Tech Modern Language",
      "Hyperlink and Text Markup Language",
      "Home Tool Markup Language",
    ],
    correctAnswer: "Hyper Text Markup Language",
  },
  {
    id: 2,
    question: "What is the main purpose of CSS?",
    options: [
      "To structure the web page",
      "To handle server-side logic",
      "To style the web page and control its layout",
      "To manage databases",
    ],
    correctAnswer: "To style the web page and control its layout",
  },
  {
    id: 3,
    question: "Which hook is used to manage state in a React functional component?",
    options: ["useEffect", "useState", "useContext", "useReducer"],
    correctAnswer: "useState",
  },
  {
    id: 4,
    question: "What is Git?",
    options: [
      "A JavaScript library",
      "A programming language",
      "A version control system",
      "A text editor",
    ],
    correctAnswer: "A version control system",
  },
  {
    id: 5,
    question: "What does 'API' stand for?",
    options: [
      "Application Programming Interface",
      "Advanced Programming Integration",
      "Application Process Interface",
      "Automated ProgrammingInput",
    ],
    correctAnswer: "Application Programming Interface",
  },
];

// Type definition for the selected answers state
type SelectedAnswers = Record<number, string>;

const Quiz = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1;

  /**
   * Handles selecting an answer for the current question
   */
  const handleAnswerSelect = (questionId: number, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  /**
   * Moves to the next question or submits the quiz if on the last question
   */
  const handleNextOrSubmit = () => {
    // Check if an answer is selected
    if (!selectedAnswers[currentQuestion.id]) {
      toast({
        title: "No Answer Selected",
        description: "Please select an answer to continue.",
        variant: "destructive",
      });
      return;
    }

    if (isLastQuestion) {
      // Calculate score
      let finalScore = 0;
      quizQuestions.forEach((q) => {
        if (selectedAnswers[q.id] === q.correctAnswer) {
          finalScore++;
        }
      });
      
      setScore(finalScore);
      setQuizFinished(true);
      
      toast({
        title: "Quiz Submitted!",
        description: `You scored ${finalScore} out of ${quizQuestions.length}.`,
      });

    } else {
      // Move to the next question
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  /**
   * Renders the results screen when the quiz is finished
   */
  if (quizFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8 space-y-6 text-center hover-lift animate-fade-in shadow-xl">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-3xl font-bold text-foreground">Quiz Completed!</h1>
          <p className="text-2xl text-muted-foreground">
            Your Score:
            <span className="font-bold text-foreground ml-2">
              {score} / {quizQuestions.length}
            </span>
          </p>
          <Button onClick={() => navigate("/dashboard")} className="w-full sm:w-1/2 mx-auto">
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  /**
   * Renders the current quiz question
   */
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 space-y-6 hover-lift animate-fade-in shadow-xl">
        {/* Quiz Header */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-foreground">Take the Quiz</h1>
            <span className="text-sm font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
              Question {currentQuestionIndex + 1} of {quizQuestions.length}
            </span>
          </div>
          <p className="text-muted-foreground">Test your knowledge.</p>
        </div>

        {/* Current Question */}
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-semibold text-foreground">
            {currentQuestion.question}
          </h2>
          
          {/* Answer Options */}
          <div className="flex flex-col space-y-3">
            {currentQuestion.options.map((option) => (
              <Button
                key={option}
                variant={selectedAnswers[currentQuestion.id] === option ? "default" : "outline"}
                onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                className="w-full justify-start text-left h-auto py-3 whitespace-normal"
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Navigation Button */}
        <Button
          onClick={handleNextOrSubmit}
          className="w-full mt-6"
        >
          {isLastQuestion ? "Submit Quiz" : "Next Question"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Card>
    </div>
  );
};

export default Quiz;
