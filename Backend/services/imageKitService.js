import ImageKit from "imagekit";

const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = process.env;

if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
  console.log(IMAGEKIT_PUBLIC_KEY);
  console.log(IMAGEKIT_URL_ENDPOINT);
  throw new Error("ImageKit environment variables are not set");
}

const imagekit = new ImageKit({
  publicKey: IMAGEKIT_PUBLIC_KEY,
  privateKey: IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: IMAGEKIT_URL_ENDPOINT,
});

export const uploadCertificate = async (buffer, originalName) => {
  const fileName = `${Date.now()}-${originalName}`;

  const result = await imagekit.upload({
    file: buffer,
    fileName,
  });

  return result.url;
};

