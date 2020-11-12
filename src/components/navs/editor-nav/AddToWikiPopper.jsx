import React, { useContext, useState, useEffect, useCallback } from 'react';

import PopperVerticalContainer from '../../containers/PopperVerticalContainer';
import { LinkSelectionRangeRef } from './LinkSelectionRangeRef';

import { LeftNavContext } from '../../../contexts/leftNavContext';
import { SettingsContext } from '../../../contexts/settingsContext';

import { createTagLink, selectionHasEntityType } from '../../editor/editorFunctions';
import { buildAddToWikiStructure } from '../navFunctions';

// Prevents the constructor from constantly rerunning, and saves the selection.
let referenceElement = new LinkSelectionRangeRef();

const AddToWikiPopper = ({ setDisplayLinkPopper }) => {
	// STATE
	const [allTags, setAllTags] = useState([]);
	const [tagFilter, setTagFilter] = useState('');
	const [leftOffset, setLeftOffset] = useState(0);
	const [rightOffset, setRightOffset] = useState(0);
	const [isInvalid, setIsInvalid] = useState(false);

	// CONTEXT
	const {
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
		// !isInvalid && popperInputRef.current.focus();
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

		setLeftOffset(leftNav + 50);
		setRightOffset(rightNav + 50);
	}, [editorStyles, editorSettings, referenceElement]);

	const handleDocClick = useCallback(
		(docId) => {
			createTagLink(
				docId,
				editorStateRef,
				linkStructureRef,
				navData.currentDoc,
				setEditorStateRef.current,
				setLinkStructure,
				setSyncLinkIdList
			);
			setDisplayLinkPopper(false);
		},
		[navData]
	);

	return (
		<PopperVerticalContainer
			closeFn={() => setDisplayLinkPopper(false)}
			isContentRendered={!!allTags.length}
			{...{
				leftOffset,
				rightOffset,
				referenceElement,
			}}>
			<div className='add-to-wiki-wrapper'>
				<p className='popper-title'>Add to Wiki</p>
				<hr />
				{buildAddToWikiStructure(docStructureRef.current.pages, '', handleDocClick)}
			</div>
		</PopperVerticalContainer>
	);
};

export default AddToWikiPopper;
