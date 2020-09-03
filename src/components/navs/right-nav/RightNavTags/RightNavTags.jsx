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
	const [isOpenSource, setIsOpenSource] = useState({});
	const [isOpenDest, setIsOpenDest] = useState({});
	const [usedSourceTags, setUsedSourceTags] = useState({});

	const {
		linkStructure,
		setLinkStructure,
		linkStructureRef,
		navData,
		editorStyles,
		setEditorStyles,
	} = useContext(LeftNavContext);

	// Keeps the currentDoc in state
	useEffect(() => {
		if (currentDoc !== navData.currentDoc) {
			setCurrentDoc(navData.currentDoc);
		}
	}, [navData.currentDoc, currentDoc]);

	// Keeps the list of pageTags up to date
	useEffect(() => {
		if (linkStructure.docTags && linkStructure.docTags.hasOwnProperty(currentDoc)) {
			setPageTags(linkStructure.docTags[currentDoc]);
		} else {
			setPageTags([]);
		}
	}, [linkStructure, currentDoc]);

	// Maintain a list of all tags we link to from this page
	useEffect(() => {
		if (linkStructure.docLinks && linkStructure.docLinks.hasOwnProperty(currentDoc)) {
			let allPageLinkedTags = Object.values(linkStructure.docLinks[currentDoc]);
			let uniquePageLinkedTags = [...new Set(allPageLinkedTags)];
			setPageLinkedTags(uniquePageLinkedTags);
		} else {
			setPageLinkedTags([]);
		}
	}, [linkStructure.docLinks, currentDoc]);

	// Maintain a list of all links to each tag on this page
	useEffect(() => {
		if (pageLinkedTags.length) {
			let newUsedSourceTags = {};
			for (const tag of pageLinkedTags) {
				let usedTagLinks = [];
				let allLinksToTag = linkStructure.tagLinks[tag];
				console.log('allLinksToTag: ', allLinksToTag);

				for (const linkId of allLinksToTag) {
					console.log('linkId: ', linkId);
					if (linkStructure.links[linkId].source === navData.currentDoc) {
						console.log('pushing a new link!');
						usedTagLinks.push(linkId);
					}
				}

				newUsedSourceTags[tag] = usedTagLinks;
			}

			setUsedSourceTags(newUsedSourceTags);
		}
	}, [linkStructure, pageLinkedTags, navData]);

	const deleteTag = useCallback(
		(docName, tagName) => {
			let newLinkStructure = JSON.parse(JSON.stringify(linkStructureRef.current));

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
		[linkStructureRef, currentDoc]
	);

	// Shows or hides ALL tags
	const handleShowHideTags = useCallback(() => {
		setEditorStyles({
			...editorStyles,
			showAllTags: !editorStyles.showAllTags,
		});
	}, [editorStyles]);

	// Shows or hides individual tags
	const handleShowHideIndTags = useCallback(
		(e, tagName) => {
			e.stopPropagation();
			let newShowIndTags = [...editorStyles.showIndTags];
			if (newShowIndTags.includes(tagName)) {
				// If the tag was already included, remove it
				let itemIndex = newShowIndTags.indexOf(tagName);
				newShowIndTags.splice(itemIndex, 1);
			} else {
				// If it wasn't included, add it
				newShowIndTags.push(tagName);
			}

			setEditorStyles({
				...editorStyles,
				showIndTags: newShowIndTags,
			});
		},
		[editorStyles]
	);

	// TO click to jump to a link
	// We need to queue a scrollTo event that the decorators monitor and if it is their linkId,
	// they calculate the top offset of their block and scroll the page to that.
	// This will have a multi-block issue. I think even if the first one removes the item from the queue,
	// I suspect the others will still fire.
	// ALTERNATIVE: simply find the block in the content state and calculate the position that way

	// Also need render the content from the linkStructure for each of the tag links on the source page

	return (
		<>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<button className='show-hide-tags-button' onClick={handleShowHideTags}>
					{editorStyles.showAllTags ? 'Hide' : 'Show'}
				</button>
				<div className='add-tag-button' onClick={() => setShowNewTagInput(true)}>
					<PlusSVG />
				</div>
			</div>
			{showNewTagInput && <NewTag {...{ setShowNewTagInput }} />}

			{/* DESTINATION LINKS */}
			{pageTags.map((item) => (
				<Fragment key={item}>
					<p
						className={'tag-item' + (isOpenSource[item] ? ' open' : '')}
						key={item}
						onClick={() => setIsOpenSource({ ...isOpenSource, [item]: !isOpenSource[item] })}>
						<CaratDownSVG />
						{item}
					</p>
					<Collapse isOpen={!!isOpenSource[item]}>
						<div className='tag-item-options'>
							<span onClick={(e) => deleteTag(currentDoc, item)}>Delete</span>
							<span>Auto-tag</span>
						</div>
					</Collapse>
				</Fragment>
			))}

			{/* SOURCE LINKS */}
			<div style={{ marginTop: '1rem' }}>
				{pageLinkedTags.map((item) => (
					<Fragment key={item}>
						<div
							className={'tag-item source' + (isOpenDest[item] ? ' open' : '')}
							key={item}
							onClick={() => setIsOpenDest({ ...isOpenDest, [item]: !isOpenDest[item] })}>
							<CaratDownSVG />
							<p style={{ margin: '0' }}>
								{item}
								{usedSourceTags[item] ? ' - ' + usedSourceTags[item].length : ''}
							</p>
							<button
								className='show-hide-tags-button'
								style={{ marginLeft: 'auto' }}
								onClick={(e) => handleShowHideIndTags(e, item)}>
								{editorStyles.showIndTags.includes(item) ? 'Hide' : 'Show'}
							</button>
						</div>
						<Collapse isOpen={!!isOpenDest[item]}>
							<div className='tag-item-options'>
								<span onClick={(e) => deleteTag(currentDoc, item)}>Delete</span>
								<span>Auto-tag</span>
							</div>
						</Collapse>
					</Fragment>
				))}
			</div>
		</>
	);
};

export default RightNavTags;
