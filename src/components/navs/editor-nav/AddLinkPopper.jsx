import React, { useContext, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { usePopper } from 'react-popper';

import { LinkSelectionRangeRef } from './LinkSelectionRangeRef';

import { LeftNavContext } from '../../../contexts/leftNavContext';
import { SettingsContext } from '../../../contexts/settingsContext';

import EllipsisSVG from '../../../assets/svg/EllipsisSVG';

// Prevents the constructor from constantly rerunning, and saves the selection.
let referenceElement = new LinkSelectionRangeRef();

const AddLinkPopper = ({ createTagLink, setDisplayLinkPopper }) => {
	// REFS
	const popperElement = useRef(null);
	const arrowElement = useRef(null);
	const popperInputRef = useRef(null);

	// STATE
	const [allTags, setAllTags] = useState([]);
	const [tagFilter, setTagFilter] = useState('');
	const [leftOffset, setLeftOffset] = useState(0);
	const [rightOffset, setRightOffset] = useState(0);
	const [minWidth, setMinWidth] = useState(0);
	console.log('minWidth: ', minWidth);

	// CONTEXT
	const { linkStructure, navData, editorStyles } = useContext(LeftNavContext);
	const { editorSettings } = useContext(SettingsContext);

	// POPPER
	const { styles, attributes } = usePopper(referenceElement, popperElement.current, {
		placement: 'top',
		modifiers: [
			{ name: 'arrow', options: { element: arrowElement.current } },
			{
				name: 'offset',
				options: {
					offset: [0, 10],
				},
			},
			{ name: 'flip', options: { padding: 100 } },
			{
				name: 'preventOverflow',
				options: {
					padding: { left: leftOffset, right: rightOffset },
				},
			},
		],
	});

	// Initial rebuild of referenceElement
	useEffect(() => {
		console.log('recreating the referenceElement');
		referenceElement = new LinkSelectionRangeRef();
	}, []);

	// Adds a scroll listener to reposition our reference element.
	// Managed here to remove on unmount
	useEffect(() => {
		referenceElement.update();
		popperInputRef.current.focus();
		window.addEventListener('scroll', referenceElement.update);
		return () => {
			window.removeEventListener('scroll', referenceElement.update);
		};
	}, [referenceElement]);

	// Calculates the left and right popper boundaries
	useEffect(() => {
		referenceElement.update();

		let rootSize = Number(
			window
				.getComputedStyle(document.querySelector(':root'))
				.getPropertyValue('font-size')
				.replace('px', '')
		);
		console.log('popper root size: ', rootSize);

		let leftNav = editorStyles.leftIsPinned ? editorStyles.leftNav * rootSize : 0;
		let rightNav = editorStyles.rightIsPinned ? editorStyles.rightNav * rootSize : 0;
		let maxEditor = editorSettings.editorMaxWidth * rootSize;
		let windowWidth = window.innerWidth;
		let gutter = Math.max(windowWidth - leftNav - rightNav - maxEditor, 0);
		let newLeftOffset = leftNav + gutter / 2;
		let newRightOffset = rightNav + gutter / 2;

		console.log('leftNav', leftNav);
		console.log('rightNav', rightNav);
		console.log('maxEditor', maxEditor);
		console.log('windowWidth', windowWidth);
		console.log('gutter', gutter);
		console.log('newLeftOffset', newLeftOffset);
		console.log('newRightOffset', newRightOffset);

		console.log(newLeftOffset);
		console.log(newRightOffset);

		setLeftOffset(newLeftOffset);
		setRightOffset(newRightOffset);
	}, [editorStyles, editorSettings, referenceElement]);

	// Update the list of tags when the linkStructure changes
	useEffect(() => {
		let filteredDocTags = { ...linkStructure.docTags };
		delete filteredDocTags[navData.currentDoc];

		let newTags = Object.values(filteredDocTags).flat();
		let filteredTags = newTags.filter((item) => item.includes(tagFilter));

		setAllTags(filteredTags);
	}, [linkStructure, tagFilter, navData]);

	// Add listener to stop text blur on
	useEffect(() => {
		const handleStopBlur = (e) => {
			e.preventDefault();
		};

		document.addEventListener('mousedown', handleStopBlur);

		return () => {
			document.removeEventListener('mousedown', handleStopBlur);
		};
	}, []);

	// Closes the popper if clicking outside the popper or hitting escape
	useEffect(() => {
		const handleEscapePopper = (e) => {
			console.log('click or keypress triggered');
			if (!popperElement.current.contains(e.target) || e.keyCode === 27) {
				e.stopPropagation();
				setDisplayLinkPopper(false);
			}
		};

		document.addEventListener('click', handleEscapePopper);
		document.addEventListener('keyup', handleEscapePopper);

		return () => {
			document.removeEventListener('click', handleEscapePopper);
			document.removeEventListener('keyup', handleEscapePopper);
		};
	}, []);

	useLayoutEffect(() => {
		if (minWidth === 0 && allTags.length) {
			console.log('popper.current: ', popperElement.current);
			console.log('clientWidth: ', popperElement.current.clientWidth);
			setMinWidth(popperElement.current.clientWidth / 2 + 15);
		}
	}, [minWidth, allTags]);

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
		<div
			ref={popperElement}
			style={styles.popper}
			{...attributes.popper}
			id='link-popper-element'>
			<div className='link-popper' style={{ minWidth: minWidth }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'stretch',
						padding: '0.5rem 0.25rem 0.5rem 0.5rem',
					}}>
					{/* Text input for filter */}
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

					{/* Loop through first 3 tag buttons */}
					{allTags.slice(0, 3).map((item, i) => (
						<button
							key={item}
							className={
								'link-popper-tag-button' +
								(i === 0 ? ' first' : i === allTags.length - 1 ? ' last' : '')
							}
							onClick={() => {
								createTagLink(item);
								setDisplayLinkPopper(false);
							}}>
							{item}
						</button>
					))}

					{/* Display an ellipsis if more than 3 tags available */}
					{allTags.length > 3 && <EllipsisSVG />}

					{/* Default text for no tags. */}
					{!allTags.length && <p>No tags.</p>}
				</div>
				<div ref={arrowElement} className='link-popper-arrow' style={styles.arrow} />
			</div>
		</div>
	);
};

export default AddLinkPopper;
