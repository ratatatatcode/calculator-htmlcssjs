const COLLECTIONS = {
  USERS: "users",
  PREFERENCES: "preferences", 
  MATCHES: "matches",
  MATCH_REQUESTS: "matchRequests",
  EMBEDDINGS: "embeddings"
};

const DOCUMENT_STRUCTURES = {
  USERS: {
    email: "string",
    username: "string", 
    birthdate: "string",
    skillsWanted: "array",
    skillsOffered: "array",
    profilePicture: "string",
    createdAt: "timestamp",
    role: "string",
    
    preferences: "array",
    isActivelyMatching: "boolean",
    lastMatchRequest: "timestamp"
  },

  PREFERENCES: {
    userId: "string",
    rankedPreferences: "array",
    timestamp: "timestamp"
  },

  MATCHES: {
    userA: "string",
    userB: "string",
    matchedOn: "timestamp"
  },

  MATCH_REQUESTS: {
    requesterId: "string",
    requestedOn: "timestamp", 
    status: "string"
  },

  EMBEDDINGS: {
    skill: "string",
    embedding: "array",
    timestamp: "timestamp",
    createdAt: "timestamp",
    deleted: "boolean"
  }
};

const REQUIRED_INDEXES = [
  {
    collection: "users",
    fields: ["isActivelyMatching", "createdAt"]
  },
  {
    collection: "matchRequests", 
    fields: ["status", "requestedOn"]
  },
  {
    collection: "matches",
    fields: ["userA", "matchedOn"]
  },
  {
    collection: "matches", 
    fields: ["userB", "matchedOn"]
  }
];

module.exports = {
  COLLECTIONS,
  DOCUMENT_STRUCTURES,
  REQUIRED_INDEXES
}; 