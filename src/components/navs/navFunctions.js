import {
  setObjPropertyAtPropertyPath,
  insertIntoArrayAtPropertyPath,
  retrieveContentAtPropertyPath
} from '../../utils/utils';

// Inserts a new file/folder into the docStructure
export const addFile = (
  fileType,
  docStructure,
  setDocStructure,
  currentTab,
  lastClickedType,
  lastClickedId,
  navData,
  setNavData
) => {
  // Create a docStructure object for our current tab.
  // We'll insert our file and overwrite this section of docStructure.
  let folderStructure = JSON.parse(JSON.stringify(docStructure[currentTab]));
  console.log('folderStructure:', folderStructure)
  console.log('docStructure[currentTab]:', docStructure[currentTab])
  console.log('currentTab:', currentTab)
  let maxIds = JSON.parse(JSON.stringify(docStructure.maxIds));
  // Note the spread operator only performs a shallow copy (nested objects are still refs).
  //   The JSON method performs a deep copy.

  // Find out where we need to insert the new file
  let filePath = '';
  console.log('lastClicked.type: ', lastClickedType);
  if (lastClickedType !== '') {
    let tempPath = findFilePath(
      folderStructure,
      '',
      lastClickedType,
      lastClickedId
    );
    console.log('lastClickedType:', lastClickedType)
    console.log('lastClickedId:', lastClickedId)

    console.log('tempPath: ', tempPath);
    filePath =
      tempPath +
      (lastClickedType === 'folder'
        ? (tempPath === '' ? '' : '/') + `folders/${lastClickedId}`
        : '');

    console.log('filePath: ', filePath);
  }

  // Build the object that will go in 'children' at the path
  let childObject = {
    type: fileType,
    id: maxIds[fileType] + 1,
    name: fileType === 'Doc' ? 'New Document' : `New ${fileType}`,
  };
  if (fileType === 'doc') {
    childObject.fileName = 'doc' + childObject.id + '.json';
  }

  // Build the object that will go in 'folders' at the path.
  if (fileType === 'folder') {
    let folderObject = { folders: {}, children: [] };
    // Insert the folder into the folder structure
    console.log('filepath: ', filePath);
    folderStructure = setObjPropertyAtPropertyPath(
      filePath + (filePath === '' ? '' : '/') + 'folders/' + childObject.id,
      folderObject,
      folderStructure
    );
    console.log(folderStructure);
  }

  let insertIndex;
  // If we're inserting on a doc, insert the file directly below it
  if (lastClickedType === 'doc') {
    const childrenArray = retrieveContentAtPropertyPath(
      filePath + (filePath === '' ? '' : '/') + 'children',
      folderStructure
    );
    let prevIndex = childrenArray.findIndex((item) => (
      item.id === lastClickedId && item.type === lastClickedType)
    );
    if (prevIndex > -1) {
      insertIndex = prevIndex + 1;
    }
  }


  // Inserts the new child into our folderStructure at the destination path
  folderStructure = insertIntoArrayAtPropertyPath(
    filePath + (filePath === '' ? '' : '/') + 'children',
    childObject,
    folderStructure,
    insertIndex
  );
  console.log(folderStructure);

  // Will put the file name into edit mode
  let newEditFileId = fileType + '-' + (maxIds[fileType] + 1);
  if (fileType === 'doc') {
    setNavData({
      ...navData,
      editFile: newEditFileId,
      currentDoc: childObject.fileName,
      lastClicked: { type: 'doc', id: childObject.id },
    });
  } else {
    setNavData({ ...navData, editFile: newEditFileId });
  }

  // console.log(folderStructure);

  // Increment the max ID for a file type
  maxIds[fileType] = maxIds[fileType] + 1;

  setDocStructure({ ...docStructure, [currentTab]: folderStructure, maxIds });
};


// Finds the file path of a given file a docStructure folder
export const findFilePath = (currentFolder, path, fileType, fileId) => {
  // For this folder level's children, look for a matching type and id
  for (let child of currentFolder.children) {
    if (child.type === fileType && child.id === fileId) {
      console.log(`found ${fileType} ${fileId} at ${path}`);
      return path;
    }
  }

  // Look for a matching type and id in the children folders
  for (let folderName in currentFolder.folders) {
    let filePath = findFilePath(
      currentFolder.folders[folderName],
      path + (path === '' ? '' : '/') + 'folders/' + folderName,
      fileType,
      fileId
    );
    // console.log(filePath);
    if (filePath) {
      console.log(`returned filePath: ${filePath}`);
      return filePath;
    }
  }
};

export const deleteDocument = (docStructure, setDocStructure, linkStructure, setLinkStructure, currentTab, docId) => {
  console.log('docId:', docId)
  console.log('currentTab:', currentTab)
  console.log('docStructure:', docStructure)
  // Delete from the docStructure
  // Remove all links on that page from the linkStructure
  // Remove the actual file

  const fileName = removeDocFromDocStructure(docStructure, setDocStructure, currentTab, docId);
  removeAllLinksRelatedToFile(linkStructure, setLinkStructure, fileName);



}

// Removes a specific document from the docStructure and saves it
const removeDocFromDocStructure = (docStructure, setDocStructure, currentTab, docId) => {
  const folderStructure = docStructure[currentTab];

  const filePath = findFilePath(folderStructure, '', 'doc', Number(docId));
  const childrenPath = filePath + (filePath === '' ? '' : '/') + 'children';
  let childrenArray = retrieveContentAtPropertyPath(
    childrenPath,
    folderStructure
  );
  const docIndex = childrenArray.findIndex((item) => (
    item.id === Number(docId) && item.type === 'doc')
  );

  const fileName = childrenArray[docIndex].fileName;
  childrenArray.splice(docIndex, 1);

  const newFolderStructure = setObjPropertyAtPropertyPath(childrenPath, childrenArray, folderStructure);
  let newDocStructure = JSON.parse(JSON.stringify(docStructure));
  newDocStructure[currentTab] = newFolderStructure;

  setDocStructure(newDocStructure);

  return fileName;
}

const removeAllLinksRelatedToFile = (linkStructure, setLinkStructure, fileName) => {
  console.log('removing links for: ');
  console.log('fileName:', fileName)
  console.log('linkStructure:', linkStructure)



  // find fileName in docTags, retrive the tags to that page
  //   remove the fileName property from docTags
  // in tagLinks, find all linkIds TO this page
  //   remove the tag from the tagLinks
  // in docLinks, find all linkIds FROM this page and what tag they link to
  //   remove this fileName property from docLinks
  // in tagLinks, for each tag that was linked to FROM this page (using linkId and tag from above), remove from arrays
  // in links, delete all of the linkIds that were linked FROM this page
  //   find the source for all the linkIds TO this page. Remove those links.
  // in docLinks, for each source of linkIds TO this page, remove that linkId from that source
}