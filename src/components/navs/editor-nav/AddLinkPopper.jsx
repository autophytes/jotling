import React, { useContext, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { usePopper } from 'react-popper';

import PopperContainer from '../../containers/PopperContainer';
import { LinkSelectionRangeRef } from './LinkSelectionRangeRef';

import { LeftNavContext } from '../../../contexts/leftNavContext';
import { SettingsContext } from '../../../contexts/settingsContext';

import EllipsisSVG from '../../../assets/svg/EllipsisSVG';

import { createTagLink, selectionHasEntityType } from '../../editor/editorFunctions';
import { findAllDocsInFolder } from '../navFunctions';

// Prevents the constructor from constantly rerunning, and saves the selection.
let referenceElement = new LinkSelectionRangeRef();

const AddLinkPopper = ({ setDisplayLinkPopper }) => {
	// REFS
	const popperInputRef = useRef(null);

	// STATE
	const [allTags, setAllTags] = useState([]);
	const [tagFilter, setTagFilter] = useState('');
	const [leftOffset, setLeftOffset] = useState(0);
	const [rightOffset, setRightOffset] = useState(0);
	const [isInvalid, setIsInvalid] = useState(false);

	// CONTEXT
	const {
		linkStructure,
		navData,
		editorStyles,
		editorStateRef,
		docStructureRef,
		linkStructureRef,
		setEditorStateRef,
		setLinkStructure,
		setSyncLinkIdList,
	} = useContext(LeftNavContext);
	const { editorSettings } = useContext(SettingsContext);

	// Initial rebuild of referenceElement
	useEffect(() => {
		console.log('recreating the referenceElement');
		referenceElement = new LinkSelectionRangeRef();
	}, []);

	// Check if a LINK-DEST is selected. If so, disable popper.
	useEffect(() => {
		const hasLinkDest = selectionHasEntityType(editorStateRef.current, 'LINK-DEST');
		if (hasLinkDest) {
			setIsInvalid(true);
		}
	}, []);

	// Adds a scroll listener to reposition our reference element.
	// Managed here to remove on unmount
	useEffect(() => {
		referenceElement.update();
		!isInvalid && popperInputRef.current.focus();
		window.addEventListener('scroll', referenceElement.update);
		return () => {
			window.removeEventListener('scroll', referenceElement.update);
		};
	}, [referenceElement, isInvalid]);

	// Calculates the left and right popper boundaries
	useEffect(() => {
		referenceElement.update();

		let rootSize = Number(
			window
				.getComputedStyle(document.querySelector(':root'))
				.getPropertyValue('font-size')
				.replace('px', '')
		);

		let leftNav = editorStyles.leftIsPinned ? editorStyles.leftNav * rootSize : 0;
		let rightNav = editorStyles.rightIsPinned ? editorStyles.rightNav * rootSize : 0;
		let maxEditor = editorSettings.editorMaxWidth * rootSize;
		let windowWidth = window.innerWidth;
		let gutter = Math.max(windowWidth - leftNav - rightNav - maxEditor, 0);
		let newLeftOffset = leftNav + gutter / 2;
		let newRightOffset = rightNav + gutter / 2;

		setLeftOffset(newLeftOffset);
		setRightOffset(newRightOffset);
	}, [editorStyles, editorSettings, referenceElement]);

	// Grab all available wiki pages to link to
	useEffect(() => {
		const docId = navData.currentDoc.slice(3, -5);
		let wikiDocs = findAllDocsInFolder(docStructureRef.current.pages, '');

		// Remove the current page from the wiki docs
		let currentDocIndex = wikiDocs.findIndex((item) => item.id.toString() === docId);
		if (currentDocIndex !== -1) {
			wikiDocs.splice(currentDocIndex, 1);
		}

		let wikiDocIds = wikiDocs.reduce((array, item) => [...array, item.id.toString()], []);
		let filteredTags = wikiDocIds.filter((item) => item.includes(tagFilter));

		setAllTags(filteredTags);
	}, [tagFilter, navData]);

	// TO-DO
	// We need to check if the selection (in the editorNav) is contained by the .editor (or container?)
	// Make sure text is selected for link button to work
	// Need to add the text to the linked-to document
	//   Will be text with the other side of the link associated with it so it's rendered in a special component.
	//   When editing that text, edit the aliased text
	// Need to be able to remove link
	// Link text to more than one tag??

	// Backlinking
	// On document open, check for new link entitites to add
	//   If new, find the last USED block and insert a new block with
	//     the entity and content or alias
	//   We'll need a new decorator for this too
	// On document open, IF we aren't using an alias, make sure content is updated
	// Eventually, check for link deletions too

	return (
		<PopperContainer
			closeFn={() => setDisplayLinkPopper(false)}
			isContentRendered={!!allTags.length}
			{...{
				leftOffset,
				rightOffset,
				referenceElement,
			}}>
			<div
				style={{
					display: 'flex',
					alignItems: 'stretch',
					padding: '0.5rem 0.25rem 0.5rem 0.5rem',
				}}>
				{/* Text input for filter */}
				{!isInvalid && (
					<input
						value={tagFilter}
						ref={popperInputRef}
						// onFocus={(e) => e.preventDefault()}
						onChange={(e) => setTagFilter(e.target.value)}
						onClick={(e) => {
							e.stopPropagation();
							e.target.focus();
						}}
					/>
				)}

				{/* Loop through first 3 tag buttons */}
				{!isInvalid &&
					allTags.slice(0, 3).map((item, i) => (
						<button
							key={item}
							className={
								'link-popper-tag-button' +
								(i === 0 ? ' first' : i === allTags.length - 1 ? ' last' : '')
							}
							onClick={() => {
								createTagLink(
									item,
									editorStateRef,
									linkStructureRef,
									navData.currentDoc,
									setEditorStateRef.current,
									setLinkStructure,
									setSyncLinkIdList
								);
								setDisplayLinkPopper(false);
							}}>
							{item}
						</button>
					))}

				{/* Display an ellipsis if more than 3 tags available */}
				{!isInvalid && allTags.length > 3 && <EllipsisSVG />}

				{/* Default text for no tags. */}
				{!isInvalid && !allTags.length && <p>No tags.</p>}

				{isInvalid && <p>Cannot overwrite links to this page.</p>}
			</div>
		</PopperContainer>
	);
};

export default AddLinkPopper;
