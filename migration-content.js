function migrateContent() {
    const fs = require('fs');
    const path = require('path');
    const directoryPath = path.join(__dirname, 'content');

    //passsing directoryPath and callback function
    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 
        //listing all files using forEach
        files.forEach(function (file,index) {
            // Do whatever you want to do with the file
            if(!file.startsWith(".")){
                const fileData = require(path.join(__dirname, 'content',file));
                if(fileData.body){
                    fileData.body.forEach(function(slice){
                        slice.value.variation="default-slice"
                        slice.value.items=slice.value.repeat
                        delete slice.value.repeat
                        slice.value.primary=slice.value["non-repeat"]
                        delete slice.value["non-repeat"]
                    })
                }
                if(fileData.type){
                    fileData.type=fileData.type+"2"
                }
                fs.writeFile(path.join(__dirname, 'new_content',index+"_migrated.json"), JSON.stringify(fileData, null, 2), function writeJSON(err) {
                if (err) return console.log(err);
                console.log('writing to ' + path.join(__dirname, 'new_content',index+"_migrated.json"));
                });
            }
        });
        
        var file_system = fs
        var archiver = require('archiver');

        var output = file_system.createWriteStream('new_content_zip/target.zip');
        var archive = archiver('zip');

        output.on('close', function () {
            console.log(archive.pointer() + ' total bytes');
            console.log('archiver has been finalized and the output file descriptor has closed.');
        });

        archive.on('error', function(err){
            throw err;
        });

        archive.pipe(output);

        // append files from a sub-directory, putting its contents at the root of archive
        archive.directory("new_content", false);

        // append files from a sub-directory and naming it `new-subdir` within the archive
        //archive.directory('subdir/', 'new-subdir');

        archive.finalize();
    });
}

migrateContent()