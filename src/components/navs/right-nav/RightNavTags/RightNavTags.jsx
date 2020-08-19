import React, { useContext, useState, useEffect, useCallback, Fragment } from 'react';
import PlusSVG from '../../../../assets/svg/PlusSVG';

import { LeftNavContext } from '../../../../contexts/leftNavContext';
import NewTag from './NewTag';
import CaratDownSVG from '../../../../assets/svg/CaratDownSVG';

import Collapse from 'react-css-collapse';

const RightNavTags = ({ activeTab }) => {
	const [currentDoc, setCurrentDoc] = useState('');
	const [pageTags, setPageTags] = useState([]);
	const [pageLinkedTags, setPageLinkedTags] = useState([]);
	const [showNewTagInput, setShowNewTagInput] = useState(false);
	const [isOpen, setIsOpen] = useState({});

	const { linkStructure, setLinkStructure, navData } = useContext(LeftNavContext);

	// Keeps the currentDoc in state
	useEffect(() => {
		if (currentDoc !== navData.currentDoc) {
			setCurrentDoc(navData.currentDoc);
		}
	}, [navData.currentDoc, currentDoc]);

	// Keeps the list of pageTags up to date
	useEffect(() => {
		console.log('calling the docTags useEffect');
		if (linkStructure.docTags && linkStructure.docTags.hasOwnProperty(currentDoc)) {
			setPageTags(linkStructure.docTags[currentDoc]);
		} else {
			setPageTags([]);
		}
	}, [linkStructure, currentDoc]);

	// Maintain a list of all tags we link to from this page
	useEffect(() => {
		console.log('calling the docLinks useEffect');
		if (linkStructure.docLinks && linkStructure.docLinks.hasOwnProperty(currentDoc)) {
			let allPageLinkedTags = Object.values(linkStructure.docLinks[currentDoc]);
			let uniquePageLinkedTags = [...new Set(allPageLinkedTags)];
			setPageLinkedTags(uniquePageLinkedTags);
		} else {
			setPageLinkedTags([]);
		}
	}, [linkStructure.docLinks, currentDoc]);

	const deleteTag = useCallback(
		(docName, tagName) => {
			let newLinkStructure = JSON.parse(JSON.stringify(linkStructure));

			// Remove tag from docTags
			let currentDocTags = [
				...(newLinkStructure.docTags[docName] ? newLinkStructure.docTags[docName] : []),
			];
			if (currentDocTags.length) {
				let currentTagIndex = currentDocTags.findIndex((item) => item === tagName);
				currentDocTags.splice(currentTagIndex, 1);
				newLinkStructure.docTags[docName] = currentDocTags;
			}

			// Delete any links to our keyword
			let currentLinks = { ...(newLinkStructure.links ? newLinkStructure.links : {}) };
			let currentTagLinks = {
				...(newLinkStructure.tagLinks ? newLinkStructure.tagLinks : {}),
			};
			for (let linkNum of Object.keys(currentLinks)) {
				if (currentTagLinks.includes(linkNum)) {
					delete currentLinks.linkNum;
				}
			}
			newLinkStructure.links = currentLinks;

			// Delete the tagLinks for our tag
			if (newLinkStructure.tagLinks[tagName]) {
				delete newLinkStructure.tagLinks[tagName];
			}

			setLinkStructure(newLinkStructure);
		},
		[linkStructure, currentDoc]
	);

	return (
		<>
			<div className='add-tag-button' onClick={() => setShowNewTagInput(true)}>
				<PlusSVG />
			</div>
			{showNewTagInput && <NewTag {...{ setShowNewTagInput }} />}
			{pageTags.map((item) => (
				<Fragment key={item}>
					<p
						className={'tag-item' + (isOpen[item] ? ' open' : '')}
						key={item}
						onClick={() => setIsOpen({ ...isOpen, [item]: !isOpen[item] })}>
						<CaratDownSVG />
						{item}
					</p>
					<Collapse isOpen={!!isOpen[item]}>
						<div className='tag-item-options'>
							<span onClick={(e) => deleteTag(currentDoc, item)}>Delete</span>
							<span>Auto-tag</span>
						</div>
					</Collapse>
				</Fragment>
			))}

			{pageLinkedTags.map((item) => (
				<p key={item}>{item}</p>
			))}
		</>
	);
};

export default RightNavTags;
