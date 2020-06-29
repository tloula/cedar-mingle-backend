let db = {
  users: [
    {
      userId: "5mMMdx1E1QbV2Lb7CjcU6qES1Sj1",
      email: "john@cedarville.edu",
      name: "John",
      birthday: "01/01/2000",
      gradYear: "2021",
      gender: "male",
      major: "Computer Engineering",
      hometown: "Chicago, IL",
      about: "Hello, my name is user, nice to meet you",
      interests: "Hiking, Biking, Skiing",
      photos: {
        url: "image/adlfkjasdlasdfd/dasfdsfds",
        url: "image/adlfkjasdlasdfd/dasfdsfds",
        url: "image/adlfkjasdlasdfd/dasfdsfds",
        url: "image/adlfkjasdlasdfd/dasfdsfds",
      },
      visible: true,
      boost: false,
      swipes: 15, // Reset every night
      discoverableParty: "liked",
      ageRange: "18-21",
      createdAt: "2019-03-15T10:59:52.798Z",
      likes: {
        userId: "klsafjaslkfjlsakfj",
        userId: "klsafjaslkfjlsakfj",
      },
      dislikes: {
        userId: "klsafjaslkfjlsakfj",
        userId: "klsafjaslkfjlsakfj",
      },
      receivedLikes: {
        userId: "klsafjaslkfjlsakfj",
        userId: "klsafjaslkfjlsakfj",
      },
      receivedDislikes: {
        userId: "klsafjaslkfjlsakfj",
        userId: "klsafjaslkfjlsakfj",
      },
      matches: [
        {
          userId: "5mMMdx1E1QbV2Lb7CjcU6qES1Sj1",
          firstName: "Kristy",
          photo: "image/adlfkjasdlasdfd/dasfdsfds",
          createdAt: "2019-03-15T10:59:52.798Z",
        },
        {
          userId: "5mMMdx1E1QbV2Lb7CjcU6qES1Sj1",
          firstName: "Kristy",
          photo: "image/adlfkjasdlasdfd/dasfdsfds",
          createdAt: "2019-03-15T10:59:52.798Z",
        },
      ],
      numLikes: 5,
      numDislikes: 5,
      numReceivedLikes: 500,
      numReceivedDislikes: 0,
    },
  ],
  notifications: [
    {
      recipient: "5mMMdx1E1QbV2Lb7CjcU6qES1Sj1",
      sender: "5mMMdx1E1QbV2Lb7CjcU6qES1Sj1",
      read: "true | false",
      type: "match | message | other",
      body: "Hey",
      createdAt: "2019-03-15T10:59:52.798Z",
    },
  ],
};

const userDetails = {
  // Redux Data
  userId: "5mMMdx1E1QbV2Lb7CjcU6qES1Sj1",
  email: "john@cedarville.edu",
  fistName: "John",
  lastName: "Doe",
  birthday: "01/01/2000",
  gradYear: "2021",
  gender: "male",
  bio: "Hello, my name is user, nice to meet you",
  hometown: "Chicago, IL",
  photos: {
    url: "image/adlfkjasdlasdfd/dasfdsfds",
    url: "image/adlfkjasdlasdfd/dasfdsfds",
    url: "image/adlfkjasdlasdfd/dasfdsfds",
    url: "image/adlfkjasdlasdfd/dasfdsfds",
  },
  matches: [
    {
      userId: "5mMMdx1E1QbV2Lb7CjcU6qES1Sj1",
      firstName: "Kristy",
      photo: "image/adlfkjasdlasdfd/dasfdsfds",
    },
  ],
};
