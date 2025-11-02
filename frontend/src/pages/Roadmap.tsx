import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, TrendingUp, Target, Award, Clock } from "lucide-react";

const statsData = [
  {
    title: "Profile Completion",
    value: "75%",
    icon: Target,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Applications",
    value: "12",
    icon: TrendingUp,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    title: "Interviews",
    value: "3",
    icon: Award,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    title: "Response Time",
    value: "2 days",
    icon: Clock,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
];

const roadmapData = [
  {
    id: 1,
    title: "Complete Profile Setup",
    description: "Upload your resume and add your GitHub profile",
    status: "completed",
    date: "Completed",
  },
  {
    id: 2,
    title: "Explore Job Opportunities",
    description: "Browse through available positions matching your skills",
    status: "in-progress",
    date: "In Progress",
  },
  {
    id: 3,
    title: "Skill Assessment",
    description: "Take technical assessments to showcase your expertise",
    status: "pending",
    date: "Upcoming",
  },
  {
    id: 4,
    title: "Apply to Companies",
    description: "Submit applications to your preferred companies",
    status: "pending",
    date: "Upcoming",
  },
  {
    id: 5,
    title: "Interview Preparation",
    description: "Access interview guides and practice questions",
    status: "pending",
    date: "Upcoming",
  },
];

const quickActions = [
  { label: "Find Jobs", action: "/dashboard/jobs" },
  { label: "Read News", action: "/dashboard/news" },
  { label: "Update Profile", action: "#" },
  { label: "Take Assessment", action: "#" },
];

const Roadmap = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="gradient-grey-dark p-8 rounded-lg border shadow-md animate-fade-in">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Welcome Back! 👋</h2>
            <p className="text-muted-foreground max-w-2xl">
              Track your progress, explore opportunities, and take the next step in your career journey.
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

      {/* Roadmap Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-foreground">Your Career Roadmap</h3>
            <p className="text-muted-foreground mt-1">Complete milestones to reach your goals</p>
          </div>
          <Badge variant="secondary" className="text-sm">
            2 of 5 Complete
          </Badge>
        </div>

        <div className="space-y-4">
          {roadmapData.map((item, index) => (
            <Card
              key={item.id}
              className="p-6 hover-lift transition-all duration-300 animate-fade-in shadow-md"
              style={{ animationDelay: `${(index + 4) * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {item.status === "completed" ? (
                    <CheckCircle2 className="h-6 w-6 text-accent" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-2 flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          item.status === "completed"
                            ? "default"
                            : item.status === "in-progress"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {item.date}
                      </Badge>
                      {item.status === "in-progress" && (
                        <Button size="sm">Continue</Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <Card className="p-6 gradient-grey border shadow-md">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Award className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-2">Pro Tip</h4>
            <p className="text-muted-foreground">
              Complete your skill assessment to increase your profile visibility by 60% and get matched with better opportunities.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Roadmap;
