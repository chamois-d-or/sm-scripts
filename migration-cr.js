const Prismic = require('@prismicio/client');

// Update your-repo-name with the name of your repository.
const apiEndpoint = "https://"+process.env.REPO+".cdn.prismic.io/api/v2"
const Client = Prismic.client(apiEndpoint)

async function getDoc(ctype){
    let table=[{"type":null,"uid":null,"old":null,"new":null}];
    const document = await Client.query(Prismic.Predicates.at('document.type', ctype))
    document.results.forEach((element,index) => {
        table[index]={}
        table[index].type= ctype
        table[index].uid= element.uid
        table[index].old= element.id
    });
    const document2 = await Client.query(Prismic.Predicates.at('document.type', ctype+"2"))
    document2.results.forEach((element) => {
        index = table.findIndex( line => line.uid === element.uid);
        table[index].new=element.id
    });
    return(table)
}

async function updateContentRelationships(ctype) {

    const comparisonTable= await getDoc("page");
    const fs = require('fs');
    const path = require('path');
    const directoryPath = path.join(__dirname, 'new_files_export_before_content_rel');

    //passsing directoryPath and callback function
    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 
        //listing all files using forEach
        files.forEach(function (file) {
            // Do whatever you want to do with the file
            if(!file.startsWith(".")){
                const fileData = require(path.join(__dirname, 'new_files_export_before_content_rel',file));
                if(fileData.type===ctype+"2"){
                    //look for CR links in primary section
                    Object.keys(fileData).forEach(function(field){
                        if(fileData[field].wioUrl !== undefined){
                            newContentId = comparisonTable.find( item => item.old === fileData[field].id).new ;
                            fileData[field].wioUrl = "wio://documents/" + newContentId;
                            fileData[field].id = newContentId;
                        }
                        if(Array.isArray(fileData[field])){
                            fileData[field].forEach(function(subField,index){
                                Object.keys(fileData[field][index]).forEach(function(subField){
                                    if(fileData[field][index][subField].wioUrl !== undefined){
                                        newContentId = comparisonTable.find( item => item.old === fileData[field][index][subField].id).new ;
                                        fileData[field][index][subField].wioUrl = "wio://documents/" + newContentId;
                                        fileData[field][index][subField].id = newContentId;
                                    }
                                })
                            })
                        }
                    })
                    // look for CR links in slices
                    fileData.body.forEach(function(slice){
                        Object.keys(slice.value.primary).forEach(function(field){
                            if(slice.value.primary[field].wioUrl !== undefined){
                                newContentId = comparisonTable.find( item => item.old === slice.value.primary[field].id).new ;
                                slice.value.primary[field].wioUrl = "wio://documents/" + newContentId;
                                slice.value.primary[field].id = newContentId;
                            }
                        })
                        slice.value.items.forEach(function(field,index){
                            Object.keys(slice.value.items[index]).forEach(function(subField){
                                if(slice.value.items[index][subField].wioUrl !== undefined){
                                    newContentId = comparisonTable.find( item => item.old === slice.value.items[index][subField].id).new ;
                                    slice.value.items[index][subField].wioUrl = "wio://documents/" + newContentId;
                                    slice.value.items[index][subField].id = newContentId;
                                }
                            })
                        })
                    })
                    fs.writeFile(path.join(__dirname, 'new_files_final',file), JSON.stringify(fileData, null, 2), function writeJSON(err) {
                    if (err) return console.log(err);
                    console.log('writing to ' + path.join(__dirname, 'new_files_final',file));
                    });
                }
            }
        });

        var file_system = fs
        var archiver = require('archiver');

        var output = file_system.createWriteStream('new_files_final_zip/target.zip');
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
        archive.directory("new_files_final", false);

        // append files from a sub-directory and naming it `new-subdir` within the archive
        //archive.directory('subdir/', 'new-subdir');

        archive.finalize();
    });
}

//select the custom type here
updateContentRelationships("page")