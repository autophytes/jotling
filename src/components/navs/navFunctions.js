import React from 'react';
import { ipcRenderer } from 'electron';

import NavFolder from './left-nav/NavFolder';
import NavFolderEmpty from './left-nav/NavFolderEmpty';
import NavDocument from './left-nav/NavDocument';

import Collapse from 'react-css-collapse';

import {
  setObjPropertyAtPropertyPath,
  insertIntoArrayAtPropertyPath,
  retrieveContentAtPropertyPath,
  deleteObjPropertyAtPropertyPath,
  findFirstDocInFolder,
  findFurthestChildrenFolderAlongPath
} from '../../utils/utils';
import NavDocumentTrash from './left-nav/NavDocumentTrash';
import NavFolderTrash from './left-nav/NavFolderTrash';

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

export const deleteDocument = (
  origDocStructure, setDocStructure, origLinkStructure, setLinkStructure, docId, navData, setNavData
) => {
  console.log('docId:', docId)
  console.log('origDocStructure:', origDocStructure)
  // DONE - Delete from the docStructure
  // DONE - Remove all links on that page from the linkStructure
  // DONE - If the file is open, close it. Show the next file? Blank page?
  // NAHHHH - Remove the file from the editorState archives
  // DONE - Rename actual file to _deleted_doc3.json so it is recoverable

  // const { fileName, docStructure } = moveDocToTrash(origDocStructure, currentTab, docId);

  // Delete item out of trash array
  let docStructure = JSON.parse(JSON.stringify(origDocStructure));
  const deleteIndex = docStructure.trash.children.findIndex((item) => item.id === Number(docId));
  const deleteItem = { ...docStructure.trash.children[deleteIndex] }
  docStructure.trash.children.splice(deleteIndex, 1);

  // Remove all references in the linkStructure
  const linkStructure = removeAllLinksRelatedToFile(origLinkStructure, deleteItem.fileName);

  // Updates what file we're viewing if the deleted document was open
  if (navData.currentDoc === deleteItem.fileName) {
    let currentDoc = '';
    let lastClicked = { type: '', id: '' }

    const response = findFirstDocInFolder(docStructure[navData.currentTab]);

    if (response) {
      currentDoc = response.docName;
      lastClicked = {
        type: 'doc',
        id: response.docId
      }
    }

    setNavData({
      ...navData,
      currentDoc,
      lastClicked
    })

  }

  // Tell electron to delete the file
  ipcRenderer.invoke(
    'delete-doc',
    navData.currentTempPath,
    deleteItem.fileName
  );

  setDocStructure(docStructure);
  setLinkStructure(linkStructure);
}

export const deleteFolder = (origDocStructure, setDocStructure, currentTab, folderId, navData, setNavData) => {
  // Check if folder is empty
  // Find file path of the folder
  // Run findFirstDocInFolder. If false, folder has no document children (but could have empty folders)
  // Then remove from doc structure

  let docStructure = JSON.parse(JSON.stringify(origDocStructure));

  // Check if folder is empty.
  const filePath = findFilePath(docStructure[currentTab], '', 'folder', Number(folderId));
  const folderPath = filePath + (filePath ? '/' : '') + `folders/${folderId}`;
  const folder = retrieveContentAtPropertyPath(folderPath, docStructure[currentTab])
  const firstDoc = findFirstDocInFolder(folder);

  // Folder not empty. Show user warning.
  if (firstDoc !== false) {
    console.log('Folder not empty!')
    // Pop up a warning message explaining that the folder needs to have no documents
    // Use a popup window or a popper?
    return;
  }

  // Delete the folder from the section of the docStructure
  let parentFolder = filePath ?
    retrieveContentAtPropertyPath(filePath, docStructure[currentTab]) :
    docStructure[currentTab];
  console.log('parentFolder:', parentFolder)
  delete parentFolder.folders[folderId];
  const childIndex = parentFolder.children.findIndex((item) => item.type === 'folder' && item.id === Number(folderId));
  parentFolder.children.splice(childIndex, 1);

  // Update the copied docStructure with the changes
  if (filePath) {
    const newFolder = setObjPropertyAtPropertyPath(filePath, parentFolder, docStructure[currentTab]);
    docStructure[currentTab] = newFolder;
  } else {
    docStructure[currentTab] = parentFolder;
  }
  setDocStructure(docStructure);

  // Reset last clicked
  if (navData.lastClicked.id === Number(folderId) && navData.lastClicked.type === 'folder') {
    console.log('resetting navData');
    setNavData({
      ...navData,
      lastClicked: {
        id: '',
        type: ''
      }
    })
  }



  console.log('We would now delete the folder!!')
}

// Removes a specific document from the docStructure and saves it
export const moveDocToTrash = (origDocStructure, setDocStructure, currentTab, docId, navData, setNavData) => {
  let newDocStructure = JSON.parse(JSON.stringify(origDocStructure));

  const folderStructure = origDocStructure[currentTab];

  // Finding our variables to use
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

  // Remove our doc from our old children array
  const docToMove = {
    ...childrenArray[docIndex],
    origPath: childrenPath,
    origIndex: docIndex,
    origTab: currentTab
  };
  childrenArray.splice(docIndex, 1);
  const newFolderStructure = setObjPropertyAtPropertyPath(childrenPath, childrenArray, folderStructure);

  // Insert the doc into the trash
  newDocStructure[currentTab] = newFolderStructure;
  if (!newDocStructure.trash.children) {
    newDocStructure.trash.children = [];
  }
  newDocStructure.trash.children.unshift(docToMove);

  // If our deleted file was selected, select the first available file around it
  if (navData.currentDoc === fileName) {
    let currentDoc = '';
    let lastClicked = { type: '', id: '' }

    const response = findFirstDocInFolder(newDocStructure[currentTab]);
    console.log('response:', response)
    if (response) {
      currentDoc = response.docName;
      lastClicked = {
        type: 'doc',
        id: response.docId
      }
    }

    setNavData({
      ...navData,
      currentDoc,
      lastClicked
    })
  }

  setDocStructure(newDocStructure);
}

export const moveFolderToTrash = (origDocStructure, setDocStructure, currentTab, folderId, navData, setNavData) => {
  let newDocStructure = JSON.parse(JSON.stringify(origDocStructure));

  const folderStructure = origDocStructure[currentTab];

  // Finding our variables to use
  const filePath = findFilePath(folderStructure, '', 'folder', Number(folderId));
  const childrenPath = filePath + (filePath === '' ? '' : '/') + 'children';
  let childrenArray = retrieveContentAtPropertyPath(
    childrenPath,
    folderStructure
  );
  const folderIndex = childrenArray.findIndex((item) => (
    item.id === Number(folderId) && item.type === 'folder')
  );

  // Remove our doc from our old children array
  const folderChildToMove = {
    ...childrenArray[folderIndex],
    origPath: childrenPath,
    origIndex: folderIndex,
    origTab: currentTab
  };
  childrenArray.splice(folderIndex, 1);

  const folderPath = filePath + (filePath === '' ? '' : '/') + 'folders/' + folderId;
  let folderObjToMove = retrieveContentAtPropertyPath(
    folderPath,
    folderStructure
  );

  // Update the metadata on the folderObjToMove
  let updatedFolderObjToMove = addRestoreDataToAllChildren(
    folderStructure.folders[folderId],
    folderPath,
    currentTab
  )
  console.log('folder with updated metadata: ', updatedFolderObjToMove);


  // Update the original doc structure to remove the folder
  const folderStructureWithChildren = setObjPropertyAtPropertyPath(childrenPath, childrenArray, folderStructure);
  const folderStructureRemovedFolder = deleteObjPropertyAtPropertyPath(folderPath, folderStructureWithChildren);
  newDocStructure[currentTab] = folderStructureRemovedFolder;


  // Code to insert the folder into the trash



  setDocStructure(newDocStructure);
}

// Finds the file path of a given file a docStructure folder
const addRestoreDataToAllChildren = (currentFolder, path, currentTab) => {
  // For this folder level's children, look for a matching type and id
  let newCurrentFolder = JSON.parse(JSON.stringify(currentFolder))

  // Add the meta to the children
  let newChildrenArray = [];
  const childrenPath = path + (path === '' ? '' : '/') + 'children';
  newCurrentFolder.children.forEach((child, i) => {
    newChildrenArray.push({
      ...child,
      origPath: childrenPath,
      origIndex: i,
      origTab: currentTab
    })
  })
  newCurrentFolder.children = newChildrenArray;

  // Update all the children inside the folder (recursive, digs to all levels)
  for (let folderName in newCurrentFolder.folders) {
    let folderObject = addRestoreDataToAllChildren(
      currentFolder.folders[folderName],
      path + (path === '' ? '' : '/') + 'folders/' + folderName,
      currentTab
    );

    newCurrentFolder.folders[folderName] = folderObject;
  }

  return newCurrentFolder;
};

export const restoreDocument = (origDocStructure, setDocStructure, navData, setNavData, docId) => {
  // EVENTUALLY, if restoring from a subfolder, we need to be looking at the correct children array


  let docStructure = JSON.parse(JSON.stringify(origDocStructure));
  const trashIndex = docStructure.trash.children.findIndex((item) => item.type === 'doc' && item.id === Number(docId));

  // Copy the item to restore and delete from trash
  let docToRestore = { ...docStructure.trash.children[trashIndex] };

  docStructure.trash.children.splice(trashIndex, 1);

  const childrenPath = findFurthestChildrenFolderAlongPath(
    docStructure[docToRestore.origTab],
    docToRestore.origPath
  );

  let insertIndex = docToRestore.origPath === childrenPath ? docToRestore.origIndex : undefined;
  let currentTab = docToRestore.origTab;
  delete docToRestore.origPath;
  delete docToRestore.origIndex;
  delete docToRestore.origTab;

  const folderStructure = insertIntoArrayAtPropertyPath(childrenPath, docToRestore, docStructure[currentTab], insertIndex)
  docStructure[currentTab] = folderStructure;

  setDocStructure(docStructure);

  setNavData({
    ...navData,
    currentTab,
    currentDoc: docToRestore.fileName,
    lastClicked: {
      type: docToRestore.type,
      id: docToRestore.id
    }
  })

}

const removeAllLinksRelatedToFile = (linkStructure, fileName) => {
  let newLinkStructure = JSON.parse(JSON.stringify(linkStructure));

  // find fileName in docTags, retrive the tags to that page
  //   remove the fileName property from docTags
  const tagList = newLinkStructure.docTags[fileName];
  delete newLinkStructure.docTags[fileName];


  // in tagLinks, find all linkIds TO this page
  //   remove the tag from the tagLinks
  let linksToPage = [];
  if (tagList && tagList.length) {
    for (let tag of tagList) {
      const linkList = newLinkStructure.tagLinks[tag];
      linksToPage = [...linksToPage, ...linkList];
      delete newLinkStructure.tagLinks[tag];
    }
  }

  // in docLinks, find all linkIds FROM this page and what tag they link to
  //   remove this fileName property from docLinks
  const linksFromPage = newLinkStructure.docLinks[fileName];
  delete newLinkStructure.docLinks[fileName];

  // in tagLinks, for each tag that was linked to FROM this page (using linkId and tag from above)
  //   remove from arrays
  if (linksFromPage) {
    for (let linkId in linksFromPage) {
      const tag = linksFromPage[linkId];
      let linkArray = newLinkStructure.tagLinks[tag];

      const index = linkArray.findIndex((item) => item === Number(linkId));
      linkArray.splice(index, 1);

      newLinkStructure.tagLinks[tag] = linkArray;

      // Delete entry in "links"
      delete newLinkStructure.links[linkId];
    }
  }

  // in links, find the source for all the linkIds TO this page. Remove those links.
  // in docLinks, for each source of linkIds TO this page, remove that linkId from that source
  if (linksToPage.length) {
    for (let linkId of linksToPage) {
      const source = newLinkStructure.links[linkId].source;
      delete newLinkStructure.links[linkId];
      delete newLinkStructure.docLinks[source][linkId];
    }
  }

  // setLinkStructure(newLinkStructure);

  return newLinkStructure;

}

// Loops through the document structure and builds out the file/folder tree
export const buildFileStructure = (
  doc,
  path,
  isTrash,
  handleFolderClick,
  openFolders,
  setOpenFolders,
  openCloseFolder,
  currentlyDragging,
  setCurrentlyDragging
) => {

  return doc.children.map((child) => {
    if (child.type === 'doc') {
      return isTrash ?
        (<NavDocumentTrash
          child={child}
          key={'doc-' + child.id}
        />)
        :
        (<NavDocument
          child={child}
          path={[path, 'children'].join('/')}
          {...{ currentlyDragging, setCurrentlyDragging, openCloseFolder }}
          key={'doc-' + child.id}
        />)
        ;
    }
    if (child.type === 'folder') {
      const hasChildren = !!doc.folders[child.id]['children'].length;
      let isOpen;
      if (openFolders.hasOwnProperty(child.id)) {
        isOpen = openFolders[child.id];
      } else {
        isOpen = false;
        setOpenFolders({ ...openFolders, [child.id]: true });
      }
      return (
        <div className='file-nav folder' key={'folder-' + child.id}>
          {isTrash ? (
            <NavFolderTrash
              child={child}
              handleFolderClick={handleFolderClick}
              isOpen={openFolders[child.id]}
            />
          ) : (
              <NavFolder
                child={child}
                path={[path, 'children'].join('/')}
                {...{
                  handleFolderClick,
                  openCloseFolder,
                  currentlyDragging,
                  setCurrentlyDragging,
                  isOpen,
                }}
              />
            )}

          <Collapse isOpen={isOpen}>
            <div className='folder-contents'>
              {hasChildren ? (
                buildFileStructure(
                  doc.folders[child.id],
                  [path, 'folders', child.id].join('/'),
                  isTrash,
                  handleFolderClick,
                  openFolders,
                  setOpenFolders,
                  openCloseFolder,
                  currentlyDragging,
                  setCurrentlyDragging
                )
              ) : (
                  <NavFolderEmpty
                    path={[path, 'folders', child.id, 'children'].join('/')}
                    currentlyDragging={currentlyDragging}
                  />
                )}
            </div>
          </Collapse>
        </div>
      );
    }
  });
};