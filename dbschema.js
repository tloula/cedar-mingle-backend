let db = {
  users: [
    {
      userId: "klsafjaslkfjlsakfj",
      email: "user@cedarville.edu",
      username: "user",
      createdAt: "2019-03-15T10:59:52.798Z",
      imageUrl: "image/adlfkjasdlasdfd/dasfdsfds",
      bio: "Hello, my name is user, nice to meet you",
      website: "https://user.com",
      location: "Chicago, IL",
    },
  ],
  screams: [
    {
      user: "user",
      body: "this is the scream body",
      createdAt: "2020-06-25T18:44:59.546Z",
      likeCount: 5,
      commentCount: 2,
    },
  ],
  comments: [
    {
      username: "user",
      screamId: "adlfkajldfkjasldkf",
      body: "Nice one mate",
      createdAt: "2019-03-15T10:59:52.798Z",
    },
  ],
  notifications: [
    {
      recipient: "user",
      sender: "jonn",
      read: "true | false",
      screamId: "aldfkjasldkfjasdlf",
      type: "like | comment",
      createdAt: "2019-03-15T10:59:52.798Z",
    },
  ],
};

const userDetails = {
  // Redux Data
  credentials: {
    userId: "SDLFKNSDLFKNSDLFJ",
    email: "user@email.com",
    username: "user",
    createdAt: "2019-03-15T10:59:52.798Z",
    imageUrl: "image/adlfkjasdlfj/alskdfjlsdkfj",
    bio: "Hello, my name is user, nice to meet you",
    website: "https://user.com",
    location: "Chicago, IL",
  },
  likes: [
    {
      userUsername: "user",
      screamId: "aldkfjlaskdfjadsf",
    },
    {
      userUsername: "user",
      screamId: "adlfjkasdf",
    },
  ],
};
