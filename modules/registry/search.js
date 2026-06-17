// ================================
// REGISTRY SEARCH MODULE
// ================================

function searchSchools(schools, query, county, status) {
    return schools.filter(function(s) {
        const mQ = !query ||
            s.name.toLowerCase()
                .includes(query.toLowerCase()) ||
            s.nemis.toLowerCase()
                .includes(query.toLowerCase()) ||
            (s.sub_county || '').toLowerCase()
                .includes(query.toLowerCase()) ||
            (s.zone || '').toLowerCase()
                .includes(query.toLowerCase());
        const mC = !county || s.county === county;
        const mS = !status || s.status === status;
        return mQ && mC && mS;
    });
}

function paginateSchools(schools, page, pageSize) {
    const start = (page - 1) * pageSize;
    return {
        data: schools.slice(start, start + pageSize),
        total: schools.length,
        totalPages: Math.ceil(schools.length / pageSize),
        currentPage: page
    };
}