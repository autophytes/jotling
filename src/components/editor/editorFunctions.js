import { List, Repeat, Map } from 'immutable';
import {
  EditorState,
  SelectionState,
  ContentState,
  ContentBlock,
  genKey,
  CompositeDecorator,
  CharacterMetadata,
  Modifier,
  RichUtils,
} from 'draft-js';
import { setBlockData } from 'draftjs-utils';
import { getTextSelection } from '../../utils/draftUtils';

import { LinkSourceDecorator, LinkDestDecorator } from './decorators/LinkDecorators';
import { HighlightTagDecorator } from './decorators/HighlightTagDecorator';
import { FindReplaceDecorator } from './decorators/FindReplaceDecorator';
import { CompoundDecorator } from './decorators/CompoundDecorator';

function getEntityStrategy(type) {
  return function (contentBlock, callback, contentState) {
    contentBlock.findEntityRanges((character) => {
      const entityKey = character.getEntity();
      if (entityKey === null) {
        return false;
      }
      return contentState.getEntity(entityKey).getType() === type;
    }, callback);
  };
}

// function hashtagStrategy(contentBlock, callback, contentState) {
// 	findWithRegex(HASHTAG_REGEX, contentBlock, callback);
// }

// function findWithRegex(regex, contentBlock, callback) {
// 	const text = contentBlock.getText();
// 	let matchArr, start;
// 	while ((matchArr = regex.exec(text)) !== null) {
// 		start = matchArr.index;
// 		callback(start, start + matchArr[0].length);
// 	}
// }

const buildFindWithRegexFunction = (findTextArray, findRegisterRef, editorStateRef) => {
  var regexMetachars = /[(){[*+?.\\^$|]/g;
  // Escape regex metacharacters in the tags
  for (var i = 0; i < findTextArray.length; i++) {
    findTextArray[i] = findTextArray[i].replace(regexMetachars, '\\$&');
  }
  var regex = new RegExp('(?:' + findTextArray.join('|') + ')', 'gi');

  return function (contentBlock, callback, contentState) {
    // If we have a list of block keys, make sure this block is in it
    // if (visibleBlockKeys && !visibleBlockKeys.includes(contentBlock.getKey())) {
    // 	return;
    // }

    const text = contentBlock.getText();
    const blockKey = contentBlock.getKey();

    if (findRegisterRef) {
      removeBlockFromFindRegisterRef(findRegisterRef, blockKey, findTextArray[0]);
    }

    let matchArr, start;
    while ((matchArr = regex.exec(text)) !== null) {
      start = matchArr.index;

      // INSERT A FUNCTION that will register this as a match
      if (findRegisterRef) {
        updateFindRegisterRef(
          findRegisterRef,
          blockKey,
          start,
          findTextArray[0],
          editorStateRef
        );
      }

      callback(start, start + matchArr[0].length);
    }
  };
};

const findTagsToHighlight = (linkStructure, currentDoc) => {
  // Compiling a list of all tags
  let tagList = [];
  for (let docName of Object.keys(linkStructure.docTags)) {
    if (docName !== currentDoc) {
      tagList = [...tagList, ...linkStructure.docTags[docName]];
    }
  }

  return buildFindWithRegexFunction(tagList);
};

const findSearchKeyword = (findText, findRegisterRef, editorStateRef) => {
  return buildFindWithRegexFunction([findText], findRegisterRef, editorStateRef);
};

export const generateDecorators = (
  linkStructure,
  currentDoc,
  showAllTags,
  findText,
  findRegisterRef,
  editorStateRef
  // visibleBlockKeys
) => {
  let decoratorArray = [
    {
      strategy: getEntityStrategy('LINK-SOURCE'),
      component: LinkSourceDecorator, // CREATE A COMPONENT TO RENDER THE ELEMENT - import to this file too
    },
    {
      strategy: getEntityStrategy('LINK-DEST'),
      component: LinkDestDecorator, // CREATE A COMPONENT TO RENDER THE ELEMENT - import to this file too
    },
  ];

  if (showAllTags) {
    decoratorArray.push({
      strategy: findTagsToHighlight(linkStructure, currentDoc),
      component: HighlightTagDecorator,
    });
  }
  console.log('find text inside the decorator: ', findText);
  if (findText) {
    decoratorArray.push({
      strategy: findSearchKeyword(findText, findRegisterRef, editorStateRef),
      component: FindReplaceDecorator,
    });
  }
  // console.log('inside our decorator generating function');
  return new CompoundDecorator(decoratorArray);
  // return new CompositeDecorator(decoratorArray);
};

export const defaultDecorator = new CompositeDecorator([
  // export const defaultDecorator = new CompoundDecorator([
  {
    strategy: getEntityStrategy('LINK-SOURCE'),
    component: LinkSourceDecorator, // CREATE A COMPONENT TO RENDER THE ELEMENT - import to this file too
  },
  {
    strategy: getEntityStrategy('LINK-DEST'),
    component: LinkDestDecorator, // CREATE A COMPONENT TO RENDER THE ELEMENT - import to this file too
  },
]);

// NEW FUNCTION
// editorState, linkStructure, navData.currentDoc
// List all link entities in the document
// Pull all the tags from the link structure
// Pull all the links for each tag
// Check at all links exist in the document entities
// Add new entities for new links (include the link id and alias boolean)
// Update all content of link entities if source content updated (and no alias)
// Remove link entities that have been removed
//   If aliased, we will sever the link and leave it as orphaned instead.
//   If orphaned, remove that link and add a separate inline button notification of the severed link.

export const updateLinkEntities = (editorState, linkStructure, currentDoc) => {
  let contentState = editorState.getCurrentContent();
  let blockArray = contentState.getBlocksAsArray();

  // Grab all used Link IDs
  let usedLinkIdArray = [];
  let nonAliasedEntities = {};
  for (let block of blockArray) {
    // Looping through all blocks' entities to grab the Link IDs
    block.findEntityRanges(
      (value) => {
        let entityKey = value.getEntity();
        if (!entityKey) {
          return false;
        }

        let entity = contentState.getEntity(entityKey);
        if (entity.getType() === 'LINK-DEST') {
          usedLinkIdArray.push(entity.data.linkId);
          // Only call the second function for links that are not aliased (which we need to synchronize)
          if (linkStructure.links[entity.data.linkId].alias) {
            return false;
          }
          return true;
        }

        return false;
      },
      (start, end) => {
        let blockKey = block.getKey();
        let entityKey = block.getEntityAt(start);
        let entity = contentState.getEntity(entityKey);
        let linkId = entity.data.linkId;

        if (!nonAliasedEntities.hasOwnProperty(entityKey)) {
          nonAliasedEntities[entityKey] = { blockList: [] };
        }
        if (!nonAliasedEntities[entityKey].hasOwnProperty('startBlockKey')) {
          nonAliasedEntities[entityKey].startBlockKey = blockKey;
          nonAliasedEntities[entityKey].startOffset = start;
        }

        nonAliasedEntities[entityKey] = {
          ...nonAliasedEntities[entityKey],
          linkId,
          blockList: [...nonAliasedEntities[entityKey].blockList, blockKey],
          endBlockKey: blockKey,
          endOffset: end,
        };
      }
    );
  }

  // Grabbing all links that should be included on the page
  const tagList = linkStructure.docTags[currentDoc] ? linkStructure.docTags[currentDoc] : [];
  let allLinkIdArray = [];
  for (let tag of tagList) {
    allLinkIdArray.push(linkStructure.tagLinks[tag]);
  }

  // Comparing the total with the used to find the unused links
  let unusedLinkIds = [];
  for (let linkId of allLinkIdArray.flat()) {
    if (!usedLinkIdArray.includes(linkId)) {
      unusedLinkIds = [...unusedLinkIds, linkId];
    }
  }

  let newEditorState = editorState;
  // Inserting the unsused links at the bottom of the page
  for (let linkId of unusedLinkIds) {
    // If we have a new line character inside our content, we need to break it up into
    // multiple blocks.

    const linkContentArray = linkStructure.links[linkId].content.split('\n');
    const blockKeys = [];

    for (let content of linkContentArray) {
      let newContentState = newEditorState.getCurrentContent();
      const newBlockKey = genKey();
      blockKeys.push(newBlockKey);

      // Creating a new block with our link content
      const newBlock = new ContentBlock({
        key: newBlockKey,
        type: 'link-destination',
        text: content,
        characterList: List(Repeat(CharacterMetadata.create(), content.length)),
      });

      const newBlockMap = newContentState.getBlockMap().set(newBlockKey, newBlock);

      // Push the new content block into the editorState
      newEditorState = EditorState.push(
        newEditorState,
        ContentState.createFromBlockArray(newBlockMap.toArray()),
        'split-block'
      );

      // TO-DO
      // This createTagDestLink needs to be outside the loop, and it needs to be selecting from the
      //   start of the first block (and offset) to the ending offset of the final block.
      //   This is the only place this function is used, so we can customize it.
    }

    // Apply the LINK-DEST entity to the new block
    newEditorState = createTagDestLink(newEditorState, linkId, blockKeys);
  }

  // filter usedLinkIds down to a list of non-aliased links
  // loop through the non-aliased link ids
  //    grab the linkStructure content for each
  //    grab the editorState content
  //    compare the two. If different, set the editorState content to linkStructure content

  let linkContentState = newEditorState.getCurrentContent();

  for (let entityKey of Object.keys(nonAliasedEntities)) {
    let linkData = nonAliasedEntities[entityKey];
    let structureContent = linkStructure.links[linkData.linkId].content;

    const selectionState = SelectionState.createEmpty();
    const linkSelectionState = selectionState.merge({
      anchorKey: linkData.startBlockKey,
      anchorOffset: linkData.startOffset,
      focusKey: linkData.endBlockKey,
      focusOffset: linkData.endOffset,
    });

    linkContentState = Modifier.replaceText(
      linkContentState,
      linkSelectionState,
      structureContent,
      null,
      entityKey
    );

    const blockList = nonAliasedEntities[entityKey].blockList;
    // for (let blockKey of blockList) {
    let blockKey = blockList[0];
    let block = linkContentState.getBlockForKey(blockKey);
    let blockText = block.getText();
    let newLineIndex = blockText.lastIndexOf('\n');

    while (newLineIndex !== -1) {
      const newLineSelectionState = selectionState.merge({
        anchorKey: blockKey,
        anchorOffset: newLineIndex,
        focusKey: blockKey,
        focusOffset: newLineIndex + 1,
      });

      linkContentState = Modifier.splitBlock(linkContentState, newLineSelectionState);

      block = linkContentState.getBlockForKey(blockKey);
      blockText = block.getText();
      newLineIndex = blockText.lastIndexOf('\n');
    }
    // }
  }

  // Push the new content block into the editorState
  newEditorState = EditorState.push(newEditorState, linkContentState, 'insert-characters');

  // X. Pull the relevant tags from docTags
  // X. Pull all the link ids to those tags from tagLinks
  // X. Compare that to our linkIdArray
  // X. Insert any links that aren't already in the page
  //   x. insert our entity for the link
  //     https://jsfiddle.net/levsha/2op5cyxm/ - create block and add link
  //   a. Insert before the last empty block our content from the link and the new entity
  // 5. NEXT  -  Update any links where there is no alias in the linkStructure and the content doesn't match
  //       TO-DO - see the notes on line 145. Need to add the entity to the entire selection, not each block individually.
  // 6. Eventually, any changes we make to content with entities, we need to sync back to linkStructure

  // block.getData() might give us a map with the metadata we need
  // There's the possibility we may have a duplicate issue eventually. If so, use Map to remove duplicates.

  return newEditorState;
};

// Creating a new destination tag link
const createTagDestLink = (editorState, linkId, blockKeys) => {
  const selectionState = editorState.getSelection();
  const contentState = editorState.getCurrentContent();
  const endingBlock = contentState.getBlockForKey(blockKeys[blockKeys.length - 1]);

  // Store these to restore the selection at the end
  const anchorKey = selectionState.getAnchorKey();
  const anchorOffset = selectionState.getAnchorOffset();
  const focusKey = selectionState.getFocusKey();
  const focusOffset = selectionState.getFocusOffset();

  // Selecting the text to apply the entity(link) to
  const selectionStateForEntity = selectionState.merge({
    anchorKey: blockKeys[0], // Starting position
    anchorOffset: 0, // How much to adjust from the starting position
    focusKey: blockKeys[blockKeys.length - 1], // Ending position
    focusOffset: endingBlock.getText().length, // How much to adjust from the ending position.
  });

  // Apply the linkId as an entity to the selection
  const contentStateWithEntity = contentState.createEntity('LINK-DEST', 'MUTABLE', {
    linkId: linkId,
  });
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
  const contentStateWithLink = Modifier.applyEntity(
    contentStateWithEntity,
    selectionStateForEntity,
    entityKey
  );

  // Restoring the selection to the original selection
  const restoredSelectionState = selectionState.merge({
    anchorKey: anchorKey, // Starting block (position is the start)
    anchorOffset: anchorOffset, // How much to adjust from the starting position
    focusKey: focusKey, // Ending position (position is the start)
    focusOffset: focusOffset, // We added the space, so add 1 to this.
  });
  const reselectedEditorState = EditorState.forceSelection(
    editorState,
    restoredSelectionState
  );

  const newEditorState = EditorState.push(
    reselectedEditorState,
    contentStateWithLink,
    'apply-entity'
  );

  return newEditorState;
};

export const findVisibleBlocks = (editorRef) => {
  const bottom = window.innerHeight;
  const blockElementList = editorRef.current.editor.children[0].children;

  let blockKeyList = [];
  // Iterate through each of our blocks
  for (let element of blockElementList) {
    let rect = element.getBoundingClientRect();
    // If the block is visible on screen
    if (rect.top < bottom - 20 && rect.bottom > 80) {
      // Extract the block key and add it to the list to return
      let offsetKey = element.dataset.offsetKey;
      let blockKey = offsetKey.slice(0, offsetKey.indexOf('-'));
      blockKeyList.push(blockKey);
    } else if (blockKeyList.length) {
      // If we had previous matches and are now off screen, return the list.
      // return blockKeyList;
      break;
    }
  }
  return blockKeyList;
};

export const scrollToBlock = (blockKey, element = document) => {
  let blockElement = element.querySelector(`[data-offset-key='${blockKey}-0-0'`);

  let blockRect = blockElement.getBoundingClientRect();

  window.scrollTo({
    left: 0,
    top: Math.floor(blockRect.top + window.pageYOffset - 200, 0),
    behavior: 'smooth',
  });
};

// Creating a new source tag link
export const createTagLink = (
  tagName,
  editorStateRef,
  linkStructureRef,
  currentDoc,
  setEditorState,
  setLinkStructure
) => {
  // Increment the max id by 1, or start at 0
  let arrayOfLinkIds = Object.keys(linkStructureRef.current.links).map((item) => Number(item));
  let newLinkId = arrayOfLinkIds.length ? Math.max(...arrayOfLinkIds) + 1 : 0;

  const contentState = editorStateRef.current.getCurrentContent();
  const selectionState = editorStateRef.current.getSelection();

  // Apply the linkId as an entity to the selection
  const contentStateWithEntity = contentState.createEntity('LINK-SOURCE', 'MUTABLE', {
    linkId: newLinkId,
  });
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
  const contentStateWithLink = Modifier.applyEntity(
    contentStateWithEntity,
    selectionState,
    entityKey
  );
  const newEditorState = EditorState.push(
    editorStateRef.current,
    contentStateWithLink,
    'apply-entity'
  );

  // Get the selected text to include in the link
  const selectedText = getTextSelection(contentStateWithLink, selectionState);

  // Updating the linkStructure with the new link
  let newLinkStructure = JSON.parse(JSON.stringify(linkStructureRef.current));
  newLinkStructure.tagLinks[tagName].push(newLinkId); // FIX EVENTUALLY
  newLinkStructure.links[newLinkId] = {
    source: currentDoc, // Source document
    content: selectedText, // Selected text
    alias: null,
    sourceEntityKey: entityKey,
  };

  // Updating the linkStructure with the keyword the link is using
  if (!newLinkStructure.docLinks.hasOwnProperty(currentDoc)) {
    newLinkStructure.docLinks[currentDoc] = {};
  }
  newLinkStructure.docLinks[currentDoc][newLinkId] = tagName; // FIX EVENTUALLY

  setLinkStructure(newLinkStructure);
  setEditorState(newEditorState);
};

// Update the find match in the find register array
const updateFindRegisterRef = (findRegisterRef, blockKey, start, findText, editorStateRef) => {
  let registerArray = [...findRegisterRef.current[findText.toLowerCase()]];
  const updatedMatch = { blockKey, start };

  let matchIndex = registerArray.findIndex(
    (item) => item.blockKey === blockKey && item.start === start
  );
  if (matchIndex !== -1) {
    return;
  }

  let blockMap = editorStateRef.current.getCurrentContent().getBlockMap();
  let blockKeyOrder = [...blockMap.keys()];

  let matchingBlockKeyIndex = registerArray.findIndex((item) => item.blockKey === blockKey);
  // If we found a block with a MATCHING BLOCK KEY
  if (matchingBlockKeyIndex !== -1) {
    // If that block is AFTER ours, insert it before
    if (registerArray[matchingBlockKeyIndex].start > start) {
      // Insert our updatedMatch
      registerArray.splice(matchingBlockKeyIndex, 0, updatedMatch);
    } else {
      // Otherwise, check blocks after until find a new blockKey OR the start is after ours
      let foundMatch = false;
      while (!foundMatch && matchingBlockKeyIndex <= registerArray.length - 1) {
        // If find a new blockKey OR the start is after ours
        if (
          registerArray[matchingBlockKeyIndex].blockKey !== blockKey ||
          registerArray[matchingBlockKeyIndex].start > start
        ) {
          // Insert our updatedMatch
          registerArray.splice(matchingBlockKeyIndex, 0, updatedMatch);
          foundMatch = true;
        } else {
          matchingBlockKeyIndex += 1;
        }
      }
      // If we hit the end of the array, just push it onto the end
      if (!foundMatch) {
        registerArray.push(updatedMatch);
      }
    }
    // If we found NO MATCHING BLOCK KEY
  } else {
    // Find where the next block is in the block order
    let blockKeyIndex = blockKeyOrder.findIndex((item) => item === blockKey) + 1;
    if (blockKeyIndex === 0) {
      console.error('Our block key was NOT found in the blockKeyOrder array.');
      return;
    }

    // Check if that next block has a match. If so, inject our updatedMatch before it.
    let foundMatch = false;
    while (!foundMatch && blockKeyIndex <= blockKeyOrder.length - 1) {
      let nextBlockIndex = registerArray.findIndex(
        (item) => item.blockKey === blockKeyOrder[blockKeyIndex]
      );
      if (nextBlockIndex !== -1) {
        registerArray.splice(nextBlockIndex, 0, updatedMatch);
        foundMatch = true;
      }
      blockKeyIndex += 1;
    }

    if (!foundMatch) {
      registerArray.push(updatedMatch);
    }
  }

  findRegisterRef.current[findText.toLowerCase()] = [...registerArray];
};

const removeBlockFromFindRegisterRef = (findRegisterRef, blockKey, findText) => {
  let registerArray = [...findRegisterRef.current[findText.toLowerCase()]];
  // Remove all elements in the array for a given blockKey
  const updateRemoveIndex = () =>
    registerArray.findIndex((item) => item.blockKey === blockKey);

  let removeIndex = updateRemoveIndex();

  if (removeIndex !== -1) {
    while (removeIndex !== -1) {
      registerArray.splice(removeIndex, 1);
      removeIndex = updateRemoveIndex();
    }

    findRegisterRef.current[findText.toLowerCase()] = [...registerArray];
  }
};

export const insertTextWithEntity = (editorState, content, selection, block, text) => {
  const style = editorState.getCurrentInlineStyle();
  const entity = block.getEntityAt(selection.getStartOffset());

  const newContent = Modifier.insertText(
    content,
    selection,
    text,
    style,
    entity,
  );

  return EditorState.push(editorState, newContent, 'insert-characters');
}

export const removeLinkSourceFromSelection = (editorState, linkStructure, setLinkStructure, setSyncLinkIdList) => {
  const contentState = editorState.getCurrentContent();
  const selectionState = editorState.getSelection();

  const linkData = grabSelectionLinkIdsAndContent(editorState);
  console.log('linkData:', linkData)

  // Find what linkId(s) we're removing from the selection
  // For each link, determine if we are removing the entire link or only part
  //    - We'll need to save the text from the link ranges to compare
  // If we're removing everything, remove the link from the linkStructure (links, docLinks, tagLinks)
  // Then set the syncLinkIdList to our partial links we need to remove

  // NOTE: if just removing a segment inside a link... the link should really be split
  //   Maybe don't let people remove the middle of a link??

  // In our LINK-DEST pages, if a link is completely removed, we need to remove the links from that page as well

  // If we ever add any other entities and we only wnat to remove the LINK-SOURCE, this will be a problem
  const newContentState = Modifier.applyEntity(contentState, selectionState, null);
  const newEditorState = EditorState.push(editorState, newContentState, 'apply-entity')
  return newEditorState;
}

// Returns an object of { [linkId]: linkText } for all LINK-SOURCE in a selectionState
const grabSelectionLinkIdsAndContent = (editorState) => {
  const contentState = editorState.getCurrentContent();
  const selection = editorState.getSelection();
  const startBlockKey = selection.getStartKey();
  const startOffset = selection.getStartOffset();
  const endBlockKey = selection.getEndKey();
  const endOffset = selection.getEndOffset();

  let linkData = {};

  let block = contentState.getBlockForKey(startBlockKey);
  let finished = false;
  while (!finished) {
    const currentBlockKey = block.getKey();

    // FIND ENTITY RANGES
    block.findEntityRanges(
      (char) => {
        const entityKey = char.getEntity();
        if (!entityKey) {
          return false;
        }

        const entity = contentState.getEntity(entityKey);
        return entity.getType() === 'LINK-SOURCE';
      },
      (start, end) => {
        let adjStart = start;
        let adjEnd = end;
        let skip = false;

        // Starting block - Only use the portion of the link inside our selection
        if (currentBlockKey === startBlockKey) {
          if (adjEnd < startOffset) {
            skip = true;
          }
          adjStart = Math.max(startOffset, adjStart);
        }

        // Ending block - Only use the portion of the link inside our selection
        if (currentBlockKey === endBlockKey) {
          if (adjStart > endOffset) {
            skip = true;
          }
          adjEnd = Math.min(endOffset, adjEnd);
        }

        if (!skip) {
          // Find the linkId
          const entityKey = block.getEntityAt(adjStart);
          const entity = contentState.getEntity(entityKey);
          const entityData = entity.getData();
          const linkId = entityData.linkId;

          // Find the linkText
          const allText = block.getText();
          const linkText = allText.slice(adjStart, adjEnd);

          if (linkId !== undefined) {
            if (linkData.hasOwnProperty(linkId)) {
              linkData[linkId] = linkData[linkId] + '\n' + linkText;
            } else {
              linkData[linkId] = linkText;
            }
          }
        }



        // if starting block && ending block


        // if starting block
        // if end is before start offset, ignore the link
        //  otherwise, take the greater of the start offset or the start

        // if ending block
        // if start is after end offset, ignore the link
        //  otherwise, take the lesser of the ending offset or the end

      }
    )

    if (currentBlockKey === endBlockKey) {
      finished = true;
    }

    block = contentState.getBlockAfter(currentBlockKey);
  }

  return linkData;
}

// Checks if the selected text has a given entity type
export const selectionHasEntityType = (editorState, entityType) => {
  const currentContent = editorState.getCurrentContent();
  const selection = editorState.getSelection();
  const startBlockKey = selection.getStartKey();
  const startOffset = selection.getStartOffset();
  const endBlockKey = selection.getEndKey();
  const endOffset = selection.getEndOffset();

  let block = currentContent.getBlockForKey(startBlockKey);
  let finished = false;
  while (!finished) {
    const currentBlockKey = block.getKey();
    const length = currentBlockKey === endBlockKey ? endOffset : block.getLength();
    let i = currentBlockKey === startBlockKey ? startOffset : 0;
    for (i; i < length; i++) {
      let entityKey = block.getEntityAt(i);
      if (entityKey) {
        let entity = currentContent.getEntity(entityKey);
        if (entity.get('type') === entityType) {
          // WE FOUND OUR MATCH, DO THE THING
          return true;
        }
      }
    }

    if (currentBlockKey === endBlockKey) {
      finished = true;
    }

    block = currentContent.getBlockAfter(currentBlockKey);
  }

  return false;
};
