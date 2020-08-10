import React, { useContext, useState, useEffect } from 'react';
import PlusSVG from '../../../../assets/svg/PlusSVG';

import { LeftNavContext } from '../../../../contexts/leftNavContext';
import NewTag from './NewTag';

const RightNavTags = ({ activeTab }) => {
	const [currentDoc, setCurrentDoc] = useState('');
	const [pageTags, setPageTags] = useState([]);
	const [showNewTagInput, setShowNewTagInput] = useState(false);

	const { linkStructure, navData } = useContext(LeftNavContext);

	// Keeps the currentDoc in state
	useEffect(() => {
		if (currentDoc !== navData.currentDoc) {
			setCurrentDoc(navData.currentDoc);
		}
	}, [navData.currentDoc, currentDoc]);

	// Keeps the list of pageTags up to date
	useEffect(() => {
		if (linkStructure.docTags.hasOwnProperty(currentDoc)) {
			setPageTags(linkStructure.docTags[currentDoc]);
		} else {
			if (pageTags.length !== 0) {
				setPageTags([]);
			}
		}
	}, [linkStructure, pageTags, currentDoc]);

	console.log(linkStructure);

	return (
		<>
			<div className='add-tag-button' onClick={() => setShowNewTagInput(true)}>
				<PlusSVG />
			</div>
			{showNewTagInput && <NewTag {...{ setShowNewTagInput }} />}
			{pageTags.map((item) => (
				<p key={item}>{item}</p>
			))}
		</>
	);
};

export default RightNavTags;
