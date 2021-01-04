// Create a setter that sets both the state and ref value
export const convertSetterToRefSetter = (ref, setterFunc, value) => {
	if (typeof value === 'function') {
		ref.current = value(ref.current);
		setterFunc(ref.current);
	} else {
		ref.current = value;
		setterFunc(value);
	}
};
