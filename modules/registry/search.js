// Registry Search Module
function searchSchoolsModule(schools, query, county, status) {
    return schools.filter(function(school) {
        const matchQuery = !query ||
            school.name.toLowerCase().includes(query.toLowerCase()) ||
            school.nemis.toLowerCase().includes(query.toLowerCase()) ||
            school.zone.toLowerCase().includes(query.toLowerCase());
        const matchCounty = !county || school.county === county;
        const matchStatus = !status || school.status === status;
        return matchQuery && matchCounty && matchStatus;
    });
}