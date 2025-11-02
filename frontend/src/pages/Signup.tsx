import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
// --- Added Firebase imports ---
import { signInWithCustomToken } from "firebase/auth";
// Assuming you export your 'auth' instance from a file like this
import { auth } from "../lib/auth"; // Fixed path alias to be relative

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Added loading state
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true); // Set loading true

    // This is the endpoint from your curl command
    const signupEndpoint = "https://us-central1-rock-idiom-475618-q4.cloudfunctions.net/auth-service/api/auth/signup";

    try {
      const response = await fetch(signupEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      // --- Updated Logic ---

      // Try to parse the error message from the backend
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Signup failed");
      }

      // 1. Get the custom token from the response
      const customToken = responseData.customToken;
      if (!customToken) {
        throw new Error("Signup successful, but no token received.");
      }

      // 2. Sign in with the custom token
      await signInWithCustomToken(auth, customToken);
      
      // 3. Store token and user info in localStorage
      const user = auth.currentUser;
      if (user) {
        const idToken = await user.getIdToken();
        localStorage.setItem('idToken', idToken);
        localStorage.setItem('user', user.email || email);
      }
      
      // 4. If signup and sign-in are successful
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      
      // 5. Navigate to the main app (e.g., /upload)
      navigate("/upload");

    } catch (error) {
      // Handle network errors or errors thrown from the response
      toast({
        title: "Error",
        description: (error as Error).message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); // Set loading false
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 hover-lift animate-fade-in shadow-xl">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground">Sign up to get started</p>
        </div>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing Up..." : "Sign Up"}
          </Button>
        </form>
        
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Signup;