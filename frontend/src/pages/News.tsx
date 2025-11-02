import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Sparkles } from "lucide-react";

const featuredArticle = {
  id: 0,
  title: "The Future of Remote Work: 2025 Trends",
  category: "Featured",
  date: "2024-01-16",
  excerpt: "Discover how the landscape of remote work is evolving and what it means for your career opportunities in the tech industry.",
  image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=600&fit=crop",
};

const newsData = [
  {
    id: 1,
    title: "AI and Machine Learning Jobs See 40% Growth",
    category: "Industry Trends",
    date: "2024-01-15",
    excerpt: "The tech industry continues to see unprecedented growth in AI-related positions, with companies investing heavily in machine learning talent.",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop",
  },
  {
    id: 2,
    title: "Remote Work Opportunities Expand Globally",
    category: "Career Tips",
    date: "2024-01-14",
    excerpt: "Major tech companies announce permanent remote work policies, opening opportunities for talent worldwide.",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop",
  },
  {
    id: 3,
    title: "New Coding Bootcamps Partner with Fortune 500",
    category: "Education",
    date: "2024-01-13",
    excerpt: "Leading bootcamps form partnerships with top companies to create direct hiring pipelines for graduates.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop",
  },
  {
    id: 4,
    title: "Cybersecurity Professionals in High Demand",
    category: "Industry Trends",
    date: "2024-01-12",
    excerpt: "With increasing digital threats, companies are urgently seeking cybersecurity experts to protect their infrastructure.",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop",
  },
  {
    id: 5,
    title: "Salary Trends for Software Developers in 2025",
    category: "Career Tips",
    date: "2024-01-11",
    excerpt: "Analysis of compensation packages and benefits being offered to software engineers across different experience levels.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop",
  },
  {
    id: 6,
    title: "Top 10 Skills Employers Are Looking For",
    category: "Skills",
    date: "2024-01-10",
    excerpt: "Essential technical and soft skills that will make you stand out in the competitive job market.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop",
  },
];

const trendingTopics = [
  { name: "Artificial Intelligence", count: 156 },
  { name: "Remote Work", count: 142 },
  { name: "Cloud Computing", count: 128 },
  { name: "DevOps", count: 98 },
  { name: "Web3", count: 87 },
];

const News = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Industry News</h2>
          <p className="text-muted-foreground">Stay updated with the latest trends and opportunities</p>
        </div>
        <Button variant="outline" className="hover-lift">
          <Sparkles className="h-4 w-4 mr-2" />
          Subscribe to Newsletter
        </Button>
      </div>

      {/* Featured Article */}
      <Card className="overflow-hidden hover-lift transition-all duration-300 shadow-lg animate-fade-in">
        <div className="grid md:grid-cols-2 gap-0">
          <img
            src={featuredArticle.image}
            alt={featuredArticle.title}
            className="w-full h-full object-cover min-h-[300px]"
          />
          <div className="p-8 flex flex-col justify-center gradient-grey">
            <Badge className="w-fit mb-4 bg-primary">{featuredArticle.category}</Badge>
            <h3 className="text-3xl font-bold text-foreground mb-4">{featuredArticle.title}</h3>
            <p className="text-muted-foreground mb-6">{featuredArticle.excerpt}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(featuredArticle.date).toLocaleDateString()}
              </div>
              <Button>Read More</Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* News Grid */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-semibold text-foreground">Latest Updates</h3>
          <div className="grid gap-6 md:grid-cols-2">
            {newsData.map((article, index) => (
              <Card
                key={article.id}
                className="overflow-hidden hover-lift transition-all duration-300 animate-fade-in shadow-md"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{article.category}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(article.date).toLocaleDateString()}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground line-clamp-2">{article.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-3">{article.excerpt}</p>
                  <Button variant="ghost" size="sm" className="w-full">
                    Read More
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 shadow-md sticky top-24">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Trending Topics</h3>
              </div>
              <div className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-medium text-foreground">{topic.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {topic.count} articles
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default News;
