import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, TrendingUp, Sparkles, Search, ExternalLink } from "lucide-react";
import { auth, db } from "../lib/auth"; // Adjust path
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const News = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [newsArticles, setNewsArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState([]); // Could derive from categories if needed

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Small delay for persistence restore (edge case)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (currentUser) {
        setUser(currentUser);
        console.log("User authenticated via SDK:", currentUser.email); // Debug
        await fetchNews(currentUser);
      } else {
        console.log("No user authenticated");
        setUser(null);
        setError("Please log in to view news.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchNews = async (currentUser) => {
    setError(null);
    setLoading(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error("User document not found");
      }

      const { careerId } = userDoc.data();
      if (!careerId) {
        throw new Error("No career profile set up");
      }

      const articlesCol = collection(db, "career_news", careerId, "articles");
      const snapshot = await getDocs(articlesCol);

      const fetchedArticles = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          const publishedDate = new Date(data.published_at);
          const now = new Date();
          const diffMonths = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
          const dateText = data.date_text || (diffMonths === 0 ? "This month" : `${diffMonths} months ago`);

          return {
            id: docSnap.id,
            title: data.title || "Untitled Article",
            category: data.category || "General",
            date: data.published_at,
            excerpt: data.description || "",
            image: data.thumbnail || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop", // Fallback image
            source: data.source || "Unknown",
            dateText,
            url: data.url,
            featured: diffMonths <= 1, // Recent as featured
          };
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Latest first

      setNewsArticles(fetchedArticles);

      // Derive simple filters from categories (or keep static if preferred)
      const categoryCounts = fetchedArticles.reduce((acc, article) => {
        acc[article.category] = (acc[article.category] || 0) + 1;
        return acc;
      }, {});
      const filterList = Object.entries(categoryCounts).map(([label, count]) => ({ label, count }));
      setFilters(filterList);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching news:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const filteredArticles = newsArticles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pick featured article (latest if available)
  const featuredArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-muted-foreground">Loading news...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-destructive mb-2">Authentication Required</h2>
        <p className="text-muted-foreground mb-4">{error || "Please log in."}</p>
        <Button onClick={() => window.location.href = '/login'} className="hover-lift">
          Go to Login
        </Button>
      </div>
    );
  }

  if (filteredArticles.length === 0 && newsArticles.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-foreground mb-2">No News Found</h2>
        <p className="text-muted-foreground">Set up your career profile to see personalized news articles.</p>
      </div>
    );
  }

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

      {/* Search */}
      <Card className="p-4 shadow-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for articles, sources, or topics..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      {/* Category Filters */}
      {filters.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {filters.map((filter, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="hover-lift"
            >
              {filter.label}
              <Badge variant="secondary" className="ml-2">
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>
      )}

      {/* Featured Article */}
      {featuredArticle && (
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
              <p className="text-muted-foreground mb-6 line-clamp-3">{featuredArticle.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {featuredArticle.dateText} • {featuredArticle.source}
                </div>
                <Button 
                  onClick={() => window.open(featuredArticle.url, "_blank")}
                  className="hover-lift"
                >
                  Read More <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* News Grid */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-semibold text-foreground">Latest Updates</h3>
          <div className="grid gap-6 md:grid-cols-2">
            {filteredArticles
              .filter((article) => !article.featured)
              .map((article, index) => (
                <Card
                  key={article.id}
                  className="overflow-hidden hover-lift transition-all duration-300 animate-fade-in shadow-md"
                  style={{ animationDelay: `${(index + 1) * 100}ms` }}
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
                        {article.dateText}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground line-clamp-2">{article.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-3">{article.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{article.source}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full hover-lift"
                        onClick={() => window.open(article.url, "_blank")}
                      >
                        Read More <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
          {filteredArticles.length === 0 && newsArticles.length > 0 && (
            <p className="text-center text-muted-foreground py-8 col-span-full">No articles match your search. Try different keywords.</p>
          )}
        </div>

        {/* Sidebar - Trending Topics (static for now, could fetch if available) */}
        <div className="space-y-6">
          <Card className="p-6 shadow-md sticky top-24">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Trending Topics</h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Artificial Intelligence", count: 156 },
                  { name: "Remote Work", count: 142 },
                  { name: "Cloud Computing", count: 128 },
                  { name: "DevOps", count: 98 },
                  { name: "Web3", count: 87 },
                ].map((topic, index) => (
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