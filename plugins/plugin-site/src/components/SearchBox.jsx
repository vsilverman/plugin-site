import React from 'react';
import PropTypes from 'prop-types';
import {
    InputGroup,
    Input,
    Button
} from 'reactstrap';
import './SearchBox.css';


function SearchBox({handleOnSubmit, showFilter, setShowFilter, query, setQuery}) {
    const handleToggleShowFilter = (e) => {
        e && e.preventDefault();
        setShowFilter(!showFilter);
    };
    
    return (
        <fieldset className="SearchBox--Container">
            <div className="form-group">
                <InputGroup>
                    {setShowFilter && <Button color="primary" onClick={handleToggleShowFilter}>
                        {'Browse '}
                        <span>{showFilter ? '▼' : '◄' }</span>
                    </Button>}
                    {!setShowFilter && <Button onClick={handleOnSubmit} color="primary">Browse</Button>}
                    <Input
                        name="query"
                        value={query}
                        autoFocus
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleOnSubmit(e);
                            }
                        }}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Find plugins..."
                    />
                    <Button color="primary" onClick={handleOnSubmit}>
                        <ion-icon name="search" />
                    </Button>
                </InputGroup>
            </div>
        </fieldset>
    );
}

SearchBox.propTypes = {
    handleOnSubmit: PropTypes.func.isRequired,
    setShowFilter: PropTypes.func,
    showFilter: PropTypes.bool,
    setQuery: PropTypes.func.isRequired,
    query: PropTypes.string.isRequired
};

SearchBox.defaultProps = {
};

export default SearchBox;
