// Image Upload Route
exports.uploadImages = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });

  let imageUrls = [];
  let imagesToUpload = []; // Array of images to be uploaded
  let imageFileNames = []; // Array of images to be uploaded
  let imageToBeUploaded = {}; // Image to be uploaded
  let imageFileName; // Filename of image to be uploaded
  // String for image token
  let generatedToken = uuidv4();

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    //console.log(fieldname, file, filename, encoding, mimetype);
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong file type submitted" });
    }

    // my.image.png => ['my', 'image', 'png']
    const imageExtension = filename.split(".")[filename.split(".").length - 1];

    // Generate New Filename 32756238461724837.png
    imageFileName = `${Math.round(
      Math.random() * 1000000000000
    ).toString()}.${imageExtension}`;

    // Get OS Path
    const filepath = path.join(os.tmpdir(), imageFileName);

    // Get Image Details
    imageToBeUploaded = { filepath, mimetype };

    // Create File Stream
    file.pipe(fs.createWriteStream(filepath));

    imagesToUpload.push(imageToBeUploaded);
    imageFileNames.push(imageFileName);
  });
  busboy.on("finish", () => {
    imagesToUpload.forEach((imageToBeUploaded, index) => {
      admin
        .storage()
        .upload(imageToBeUploaded.filepath, {
          resumable: false,
          metadata: {
            metadata: {
              contentType: imageToBeUploaded.mimetype,
              //Generate token to be appended to imageUrl
              firebaseStorageDownloadTokens: generatedToken,
            },
          },
        })
        .then(() => {
          // Append token to url
          const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${imageFileNames[index]}?alt=media&token=${generatedToken}`;
          imageUrls.push(imageUrl);
          return db.doc(`/users/${req.user.email}`).update({ imageUrls });
        })
        .then(() => {
          //return res.status(200).json({ message: "image uploaded successfully" });
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).json({ error: "something went wrong" });
        });
    });
  });
  busboy.end(req.rawBody);
  return res.status(200).json({ message: "Images uploaded successfully" });
};

state
  .sleep()
  .then(() => {
    return res.status(200).json({ message: "Goodnight" });
  })
  .catch((err) => {
    return res.status(404).json({ message: "Sleep Not Found" });
  });
