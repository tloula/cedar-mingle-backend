let db = {
  // Each document has a max size of 1 MiB (1,048,576 bytes)
  // 1 Byte is 1 8-Bit ASCII Character
  // Approximately 26064 39-Character Lines Fit in 1024 KiB
  users: [
    {
      userId: "5mMMdx1E1QbV2Lb7CjcU6qES1Sj1",
      email: "john@cedarville.edu",
      name: "John",
      gender: "male",
      birthday: "01/01/2000",
      gradYear: "2021",
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
      discoverableAgeRange: "18-21",
      createdAt: "2019-03-15T10:59:52.798Z",
      likes: {
        userId: "5mMMdx1E1QbV2Lb7CjcU6qES1Sj1",
        userId: "5mMMdx1E1QbV2Lb7CjcU6qES1Sj1",
      },
      dislikes: {
        userId: "5mMMdx1E1QbV2Lb7CjcU6qES1Sj1",
        userId: "5mMMdx1E1QbV2Lb7CjcU6qES1Sj1",
      },
      receivedLikes: {
        userId: "5mMMdx1E1QbV2Lb7CjcU6qES1Sj1",
        userId: "5mMMdx1E1QbV2Lb7CjcU6qES1Sj1",
      },
      receivedDislikes: {
        userId: "5mMMdx1E1QbV2Lb7CjcU6qES1Sj1",
        userId: "5mMMdx1E1QbV2Lb7CjcU6qES1Sj1",
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
