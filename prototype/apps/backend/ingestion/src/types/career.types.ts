// Types for careers and users (from Firestore)
export interface Career {
  id: string;  // Document ID, e.g., 'data-scientist'
  displayName: string;
  description: string;
  skills: string[];
}

export interface User {
  uid: string;  // Firebase Auth UID
  email: string;
  chosenCareerId: string;  // Links to Career.id
}

export interface ActiveCareer {
  id: string;
  displayName: string;
  userCount: number;  // How many users chose this
}