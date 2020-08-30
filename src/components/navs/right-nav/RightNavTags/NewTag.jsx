import React, { useContext, useState, useCallback } from 'react';

import { LeftNavContext } from '../../../../contexts/leftNavContext';

const NewTag = ({ setShowNewTagInput }) => {
	const [tagName, setTagName] = useState('');

	const { setLinkStructure, linkStructureRef, navData } = useContext(LeftNavContext);

	// Save the new tag
	const saveTag = useCallback(
		(newTag) => {
			// No blank tags
			if (!newTag) {
				console.log('Tags cannot be blank');
				return;
			}

			// Prevents duplicate tags
			{
				let allDocTags = [];
				for (let key of Object.keys(linkStructureRef.current.docTags)) {
					allDocTags = [...allDocTags, ...linkStructureRef.current.docTags[key]];
				}

				if (allDocTags.includes(newTag.toLowerCase())) {
					// NOTE: add warning to the user!
					console.log("Can't use tags on more than one page");
					return;
				}
			}

			let newDocTags = [];

			// Loading in existing tags
			if (linkStructureRef.current.docTags.hasOwnProperty(navData.currentDoc)) {
				newDocTags = linkStructureRef.current.docTags[navData.currentDoc];
			}
			// Prepend the new tag
			newDocTags.unshift(newTag.toLowerCase());

			// Duplicate linkStructure and update the tags
			let newLinkStructure = JSON.parse(JSON.stringify(linkStructureRef.current));
			newLinkStructure.docTags[navData.currentDoc] = newDocTags;

			newLinkStructure.tagLinks[newTag.toLowerCase()] = [];

			setLinkStructure(newLinkStructure);
			setShowNewTagInput(false);
		},
		[linkStructureRef, navData]
	);

	// Handle key presses
	const handleKeyUp = (e) => {
		if (e.key === 'Enter') {
			e.target.blur();
		}
		if (e.keyCode === 27) {
			// ESCAPE
			setShowNewTagInput(false);
		}
	};

	return (
		<input
			className='add-tag-input'
			autoFocus
			onChange={(e) => setTagName(e.target.value)}
			onBlur={() => saveTag(tagName)}
			onFocus={(e) => e.target.select()}
			onKeyUp={handleKeyUp}
		/>
	);
};

export default NewTag;
