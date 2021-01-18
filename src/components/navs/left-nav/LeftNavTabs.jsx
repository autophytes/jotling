import React, { useContext } from 'react';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import BookDraftSVG from '../../../assets/svg/BookDraftSVG';
import DocumentPagesSVG from '../../../assets/svg/DocumentPagesSVG';
import LightbulbSVG from '../../../assets/svg/LightbulbSVG';

const LeftNavTabs = () => {
	const { navData, setNavData } = useContext(LeftNavContext);

	return (
		<div className='left-nav-sections'>
			<div
				className={'nav-section-tab first' + (navData.currentTab === 'draft' ? ' active' : '')}
				title='Manuscript'
				onClick={() =>
					setNavData({
						...navData,
						currentTab: 'draft',
						lastClicked: { type: '', id: '' },
					})
				}>
				<BookDraftSVG />
			</div>
			<div
				className={'nav-section-tab' + (navData.currentTab === 'research' ? ' active' : '')}
				title='Planning'
				onClick={() =>
					setNavData({
						...navData,
						currentTab: 'research',
						lastClicked: { type: '', id: '' },
					})
				}>
				<LightbulbSVG />
			</div>
			<div
				className={'nav-section-tab last' + (navData.currentTab === 'pages' ? ' active' : '')}
				title='Wikis'
				onClick={() =>
					setNavData({
						...navData,
						currentTab: 'pages',
						lastClicked: { type: '', id: '' },
					})
				}>
				<DocumentPagesSVG />
			</div>
		</div>
	);
};

export default LeftNavTabs;
