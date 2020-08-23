import React, { useContext, useState, useEffect, useRef } from 'react';
import { usePopper } from 'react-popper';

import { LinkSelectionRangeRef } from './LinkSelectionRangeRef';

import { LeftNavContext } from '../../../contexts/leftNavContext';
import EllipsisSVG from '../../../assets/svg/EllipsisSVG';

// Prevents the constructor from constantly rerunning, and saves the selection.
let referenceElement = new LinkSelectionRangeRef();

const AddLinkPopper = ({ createTagLink, setDisplayLinkPopper }) => {
	// STATE
	const popperElement = useRef(null);
	const arrowElement = useRef(null);
	// const [popperElement, setPopperElement] = useState(null);
	// const [arrowElement, setArrowElement] = useState(null);
	// const [referenceElement] = useState(new LinkSelectionRangeRef());
	const [allTags, setAllTags] = useState([]);
	const [tagFilter, setTagFilter] = useState('');

	const { linkStructure, navData } = useContext(LeftNavContext);

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
		],
	});

	// Initial rebuild of referenceElement
	useEffect(() => {
		referenceElement = new LinkSelectionRangeRef();
	}, []);

	// Adds a scroll listener to reposition our reference element.
	// Managed here to remove on unmount
	useEffect(() => {
		referenceElement.update();
		window.addEventListener('scroll', referenceElement.update);
		return () => window.removeEventListener('scroll', referenceElement.update);
	}, [referenceElement]);

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

		return () => document.removeEventListener('mousedown', handleStopBlur);
	});

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
	});

	// TO-DO
	// Takes 2 clicks on body to close the popup - why?
	// Side overflow if it has too many tags?
	// Hide behind the editorNav
	// Need to add the text to the linked-to document
	//   Will be text with the other side of the link associated with it so it's rendered in a special component.
	//   When editing that text, edit the aliased text
	// Need to be able to remove link
	// Link text to more than one tag??

	return (
		<div
			ref={popperElement}
			style={styles.popper}
			{...attributes.popper}
			id='link-popper-element'>
			<div className='link-popper'>
				<div
					style={{
						display: 'flex',
						alignItems: 'stretch',
						padding: '0.5rem 0.25rem 0.5rem 0.5rem',
					}}>
					{/* Text input for filter */}
					<input
						value={tagFilter}
						// autoFocus
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
