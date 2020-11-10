import React, { useContext } from 'react';
import RightNavTags from './RightNavTags/RightNavTags';

const RightNavContent = ({ activeTab }) => {
	return (
		<div className='right-nav-content'>
			{/* {activeTab === 'tags' && <RightNavTags {...{ activeTab }} />} */}
		</div>
	);
};

export default RightNavContent;
