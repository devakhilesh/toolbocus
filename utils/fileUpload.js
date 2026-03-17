const cloudinary = require("cloudinary").v2;

// Multiple Image Upload

exports.uploadMultiImages = async (images, folderName) => {
  let imgUrl = [];
  for (let i = 0; i < images.length; i++) {
    try {
      let result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { resource_type: "auto", folder: folderName },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          )
          .end(images[i].data); // Using buffer instead of tempFilePath
      });

      imgUrl.push({
        filename: result.public_id,
        url: result.secure_url,
      });
    } catch (error) {
      console.error(`Error uploading image ${i + 1}:`, error);
    }
  }
  return imgUrl;
};

// Multiple Image Destroy from Resource

exports.destroyMultiImages = async (images) => {
  if (images.length === 0) {
    return {
      status: true,
      message:
        "No image to delete (handled scenario when previous image not available)",
    };
  }

  let deletedResults = [];

  for (let i = 0; i < images.length; i++) {
    try {
      if (images[i].filename) {
        let result = await cloudinary.uploader.destroy(images[i].filename);

        if (result.result === "ok") {
          deletedResults.push({
            filename: images[i].filename,
            status: "deleted",
          });
        } else {
          deletedResults.push({
            filename: images[i].filename,
            status: "failed",
            message: "Failed to delete image from resource",
          });
        }
      }
    } catch (error) {
      deletedResults.push({
        filename: images[i].filename,
        status: "error",
        message: error.message,
      });
    }
  }

  return {
    status: true,
    message: "Image deletion process complete",
    data: deletedResults,
  };
};

// Single Image Upload

exports.uploadSingleImage = async (image, folderName) => {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "auto", folder: folderName },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        )
        .end(image.data);
    });

    return {
      status: true,
      message: "Image uploaded successfully",
      data: {
        filename: result.public_id,
        url: result.secure_url,
      },
    };
  } catch (error) {
    return {
      status: false,
      message: "Image upload failed: " + error.message,
    };
  }
};

// Single Image Destroy

exports.deleteSingleImage = async (image) => {
  try {

    if (image.filename) {
      // Infer resource_type from URL
      let resourceType = "image";
      if (image.url.includes("/video/")) {
        resourceType = "video";
      } else if (image.url.includes("/raw/")) {
        resourceType = "raw";
      }

      // if (image.filename) {
      const result = await cloudinary.uploader.destroy(image.filename, {
        resource_type: resourceType,
      });

      if (result.result !== "ok") {
        return {
          status: false,
          message: "Image deletion failed",
        };
      }

      console.log(
        "Image deleted successfully result + file Name",
        result,
        image.filename
      );
      return {
        status: true,
        message: "Image deleted successfully",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: "Image deletion failed: " + error.message,
    };
  }
};