import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, TrendingUp, Target, Award, Clock, BookOpen, Brain, Code, AlertCircle } from "lucide-react";
import { auth, db } from "../lib/auth"; // Adjust path
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const Roadmap = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Small delay for persistence restore (edge case)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (currentUser) {
        console.log("User authenticated via SDK:", currentUser.email); // Debug
        await fetchUserData(currentUser);
      } else {
        console.log("No user authenticated");
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchUserData = async (currentUser) => {
    setError(null);
    setLoading(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error("User document not found");
      }

      setUserData(userDoc.data());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const quickActions = [
    { label: "Find Jobs", action: "/dashboard/jobs" },
    { label: "Read News", action: "/dashboard/news" },
    { label: "Update Profile", action: "#" },
    { label: "Take Assessment", action: "#" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-muted-foreground">Loading your roadmap...</p>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-destructive mb-2">Profile Not Found</h2>
        <p className="text-muted-foreground mb-4">{error || "Please complete your profile setup."}</p>
        <Button onClick={() => navigate("/upload")} className="hover-lift">
          Set Up Profile
        </Button>
      </div>
    );
  }

  const { selected_career, skills = [], selected_gaps = [], selected_roadmap = [], recommendations = [], last_selection_date } = userData;

  // Derive stats
  const statsData = [
    {
      title: "Skills Mastered",
      value: skills.length.toString(),
      icon: Code,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Skill Gaps",
      value: selected_gaps.length.toString(),
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Roadmap Steps",
      value: selected_roadmap.length.toString(),
      icon: Target,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Recommendations",
      value: recommendations.length.toString(),
      icon: Brain,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  // Format last selection date
  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    return new Date(timestamp.toDate ? timestamp.toDate() : timestamp).toLocaleDateString();
  };

  // Other recommendations (exclude selected)
  const otherRecommendations = recommendations.filter(rec => rec.career !== selected_career);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="gradient-grey-dark p-8 rounded-lg border shadow-md animate-fade-in">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Welcome Back! 👋</h2>
            <p className="text-muted-foreground max-w-2xl">
              Your career path: <Badge variant="secondary" className="ml-2">{selected_career}</Badge>
              <br />
              Last updated: {formatDate(last_selection_date)}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="hover-lift"
                onClick={() => window.location.href = action.action}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => (
          <Card
            key={index}
            className="p-6 hover-lift animate-fade-in shadow-md"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Skills Section */}
      <Card className="p-6 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <Code className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">Your Skills</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.slice(0, 20).map((skill, index) => (
            <Badge key={index} variant="secondary">
              {skill}
            </Badge>
          ))}
          {skills.length > 20 && (
            <Badge variant="outline">+{skills.length - 20} more</Badge>
          )}
        </div>
      </Card>

      {/* Skill Gaps Section */}
      <Card className="p-6 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <h3 className="text-xl font-semibold text-foreground">Skill Gaps to Fill</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {selected_gaps.map((gap, index) => (
            <Badge key={index} variant="destructive">
              {gap}
            </Badge>
          ))}
        </div>
        {selected_gaps.length === 0 && (
          <p className="text-muted-foreground text-center py-4">No skill gaps identified!</p>
        )}
      </Card>

      {/* Roadmap Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-foreground">Your Career Roadmap</h3>
            <p className="text-muted-foreground mt-1">Follow these steps to advance in {selected_career}</p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {selected_roadmap.length} Steps
          </Badge>
        </div>

        <div className="space-y-4">
          {selected_roadmap.map((step, index) => (
            <Card
              key={index}
              className="p-6 hover-lift transition-all duration-300 animate-fade-in shadow-md"
              style={{ animationDelay: `${(index + 4) * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1 bg-primary/10 p-2 rounded-full">
                  <span className="text-primary font-bold text-lg">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xl font-semibold text-foreground mb-2">Step {index + 1}</h4>
                  <p className="text-muted-foreground">{step}</p>
                  <div className="mt-4 flex justify-end">
                    <Button size="sm" variant="outline">Start Learning</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Other Recommendations */}
      {otherRecommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-foreground">Explore Other Paths</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherRecommendations.map((rec, index) => (
              <Card key={index} className="p-6 hover-lift shadow-md">
                <div className="space-y-4">
                  <h4 className="text-xl font-semibold text-foreground">{rec.career}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium">Gaps ({rec.skill_gaps.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rec.skill_gaps.slice(0, 3).map((gap, gIndex) => (
                        <Badge key={gIndex} variant="destructive" className="text-xs">
                          {gap}
                        </Badge>
                      ))}
                      {rec.skill_gaps.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{rec.skill_gaps.length - 3}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Roadmap ({rec.roadmap.length} steps)</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.roadmap[0]}</p>
                    {rec.roadmap.length > 1 && (
                      <p className="text-xs text-muted-foreground italic">...and {rec.roadmap.length - 1} more</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Explore This Path
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tips Section */}
      <Card className="p-6 gradient-grey border shadow-md">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Award className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-2">Pro Tip</h4>
            <p className="text-muted-foreground">
              Focus on one skill gap at a time to build momentum. Consider integrating your learning with hands-on projects from your roadmap.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Roadmap;