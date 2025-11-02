import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, CheckCircle } from "lucide-react";

type Question = {
  id: string;
  text: string;
  options: string[];
};

type ConversationEntry = {
  question: string;
  answer: string;
};

const Quiz = () => {
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [quizFinished, setQuizFinished] = useState(false);
  const [finalSkills, setFinalSkills] = useState<string[]>([]);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch the next question on component mount
  useEffect(() => {
    fetchNextQuestion([]);
  }, []);

  /**
   * Fetches the next question or final skills from the API
   */
  const fetchNextQuestion = async (history: ConversationEntry[]) => {
    const token = localStorage.getItem('idToken');
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please log in to continue.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    const body = history.length === 0 ? {} : { conversation_history: history };

    try {
      const response = await fetch(
        "https://asia-south1-rock-idiom-475618-q4.cloudfunctions.net/get_dynamic_quiz",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.next_question) {
        setCurrentQuestion(data.next_question);
        setSelectedAnswer('');
      } else if (data.final_skills) {
        setFinalSkills(data.final_skills);
        setQuizFinished(true);
        toast({
          title: "Quiz Completed!",
          description: "Your skills assessment is ready.",
        });
      } else {
        throw new Error("Unexpected API response");
      }
    } catch (error) {
      console.error("Error fetching question:", error);
      toast({
        title: "Error",
        description: "Failed to load question. Please try again.",
        variant: "destructive",
      });
    }
  };

  /**
   * Handles selecting an answer for the current question
   */
  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  /**
   * Moves to the next question by submitting the current answer
   */
  const handleNext = () => {
    if (!selectedAnswer) {
      toast({
        title: "No Answer Selected",
        description: "Please select an answer to continue.",
        variant: "destructive",
      });
      return;
    }

    const newHistory = [
      ...conversationHistory,
      { question: currentQuestion!.text, answer: selectedAnswer }
    ];
    setConversationHistory(newHistory);
    fetchNextQuestion(newHistory);
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
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Your Recommended Skills</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {finalSkills.map((skill) => (
                <Badge key={skill} variant="secondary" className="px-3 py-1">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
          <Button onClick={() => navigate("/dashboard")} className="w-full sm:w-1/2 mx-auto">
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Show loading if no current question yet
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quiz...</p>
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
            <h1 className="text-3xl font-bold text-foreground">Skills Assessment</h1>
            <span className="text-sm font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
              Step {conversationHistory.length + 1}
            </span>
          </div>
          <p className="text-muted-foreground">Answer to discover your skills.</p>
        </div>

        {/* Current Question */}
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-semibold text-foreground">
            {currentQuestion.text}
          </h2>
          
          {/* Answer Options */}
          <div className="flex flex-col space-y-3">
            {currentQuestion.options.map((option) => (
              <Button
                key={option}
                variant={selectedAnswer === option ? "default" : "outline"}
                onClick={() => handleAnswerSelect(option)}
                className="w-full justify-start text-left h-auto py-3 whitespace-normal"
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Navigation Button */}
        <Button
          onClick={handleNext}
          className="w-full mt-6"
          disabled={!selectedAnswer}
        >
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Card>
    </div>
  );
};

export default Quiz;