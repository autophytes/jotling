import {
  setObjPropertyAtPropertyPath,
  insertIntoArrayAtPropertyPath,
} from '../../utils/utils';

// Inserts a new file/folder into the docStructure
export const addFile = (
  fileType,
  docStructure,
  setDocStructure,
  currentTab,
  lastClickedType,
  lastClickedId
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

  // Inserts the new child into our folderStructure at the destination path
  folderStructure = insertIntoArrayAtPropertyPath(
    filePath + (filePath === '' ? '' : '/') + 'children',
    childObject,
    folderStructure
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