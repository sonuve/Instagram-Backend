import DataUriParse from 'datauri/parser.js'; // import the parser library
import path from 'path'; // helps to work with file paths

const parse = new DataUriParse(); // create a new parser object

const getDataUri = (file) => {
    const extName = path.extname(file.originalname).toString(); // get file extension (like .jpg, .png)
    return parse.format(extName, file.buffer).content; // convert file buffer to Data URI
};

export default getDataUri; // export the function so you can use it elsewhere
