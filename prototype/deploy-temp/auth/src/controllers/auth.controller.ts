import { Request, Response } from 'express';
import { auth, db } from '../firebase';

// You should import this from 'packages/shared-types/src/user.types.ts'
// For this example, I'll define it here.
interface UserProfile {
  email: string;
  githubLink: string | null;
  resumeId: string | null;   // For the Cloud Storage ID
  careerId: string | null;   // To point to 'careers' collection later
  skills: string[];          // Starts as an empty array
  roadmap: string | null;    // Starts with no roadmap
}

/**
 * /signup
 * Creates a new user in Firebase Auth and a user profile in Firestore.
 * Returns a custom token for the client to sign in with.
 */
export const signup = async (req: Request, res: Response) => {
  try {
    // 1. Only get email and password from the request body
    const { email, password } = req.body;

    // 2. Validate *only* email and password
    if (!email || !password) {
      return res.status(400).send({ error: 'Email and password are required' });
    }

    // 3. Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      // We don't need a displayName if not provided
    });

    const uid = userRecord.uid;

    // 4. Create the new, minimal user profile document
    //    All extra fields are set to null or empty.
    const userProfile: UserProfile = {
      email: email,       // The email they signed up with
      githubLink: null,   // Will be added by another service
      resumeId: null,     // Will be added by another service
      careerId: null,     // Will be added by another service
      skills: [],         // Will be added by another service
      roadmap: null       // Will be added by another service
    };

    // 5. Set the document in 'users' collection using the UID as the document ID
    await db.collection('users').doc(uid).set(userProfile);

    // 6. Create a custom token for the client to immediately sign in
    const customToken = await auth.createCustomToken(uid);

    // 7. Send the custom token (and user info) back to the client
    res.status(201).send({
      message: 'User created successfully',
      customToken: customToken,
      uid: uid,
      email: email
    });

  } catch (error: any) {
    console.error('Error during signup:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).send({ error: 'Email already in use' });
    }
    if (error.code === 'auth/invalid-password') {
      // e.g., "Password must be at least 6 characters"
      return res.status(400).send({ error: error.message });
    }
    
    res.status(500).send({ error: 'Failed to create user' });
  }
};

/**
 * /getme
 * Requires auth (runs after checkAuth middleware).
 * Fetches the logged-in user's profile from Firestore.
 */
export const getMe = async (req: Request, res: Response) => {
  // The 'checkAuth' middleware has already run, so 'req.user' is populated
  const uid = req.user?.uid;

  if (!uid) {
    // This should technically be caught by the middleware
    return res.status(401).send({ error: 'Unauthorized' });
  }

  try {
    // 1. Fetch the user's profile from Firestore
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).send({ error: 'User profile not found' });
    }

    const userData = userDoc.data() as UserProfile;

    // 2. Fetch the career name (only if careerId exists)
    let careerName = 'Unknown Career';
    if (userData.careerId) {  // Truthy check: skips null/undefined/empty
      const careerDocRef = db.collection('careers').doc(userData.careerId);
      const careerDoc = await careerDocRef.get();
      if (careerDoc.exists) {
        careerName = careerDoc.data()?.displayName || 'Unknown Career';
      }
    }

    // 3. Return the combined user profile and career data
    res.status(200).send({
      uid: uid,
      ...userData,
      careerName: careerName,
    });

  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).send({ error: 'Failed to fetch user data' });
  }
};