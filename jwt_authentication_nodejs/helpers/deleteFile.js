const fs = require('fs').promises

const deleteFile = async (filePath)=>{
        try{
           await fs.unlink(filePath)
           console.log('Previous profile img deleted successfully')
        }
        catch(error){
            console.log(error.message)
        }
}

module.exports = {
    deleteFile
}