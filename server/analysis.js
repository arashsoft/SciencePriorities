/**
 * Created by arman on 25/02/15.
 */
/*
 analysis.js:
 (.) exctarcts probabilistic relationships between grants and publications
 (.) includes two functions:
 (-) calculate_analyzable_grants: returns the grants for which further analysis is semantically sound
 (-) award_relationship_extractor: calculates an object based on a single award proposal. The object contains related publications, each having a confidence value (simulated as a radius)

 copyright Arman Didandeh 2014
 */
// DEPENDENCIES
var async = require('async');
var _ = require('underscore');
var $ = require('jquery');
var natural = require('natural');
natural.PorterStemmer.attach();
var tokenizer = new natural.WordTokenizer();
var lda = require('lda');
var mysql = require('mysql');

exports.myTestOnTheServer = function myTestOnTheServer() {
    var text = 'it comes here';
    console.log(text);
    return text;
}

function checkInvestigator(_pid, _list) {
    var _temp = new Object();
    _temp._flag = "false";
    _temp._principal = -1;

    _list.forEach(function(_item) {
        if(_item._professorID == _pid) {
            _temp._flag = true;
            _temp._principal = _item._principal;
        }
    });

    return _temp;
}

function filterItems(_item, _list) {
    var _flag = false;
    _list.forEach(function(name) {
        if(name == _item) {
            _flag = true;
        }
    });

    return _flag;
}

function isNumber(_item) {
    return ((typeof parseInt(_item)) == ("number"));
}

function sigmoid(t) {
    return 1/(1+Math.pow(Math.E, -t));
}

exports.calculate_analyzable_grants = function calculate_analyzable_grants(callback) {
    var analyzable_grants = new Object();
    analyzable_grants._id = "analyzable_grants";
    analyzable_grants._grantList = new Array();

    var pool = mysql.createPool({
        host : '129.100.19.193',
        port : '3306',
        user : 'arman',
        password : 'redirection',
        database  : 'researchmap_new2'
    });

    var query_text = "SELECT DISTINCT award_2.Proposal FROM (award_2 INNER JOIN award_professor_2 ON award_2.ID = award_professor_2.Grant) INNER JOIN author_2 ON award_professor_2.Professor = author_2.Professor_ID WHERE author_2.Professor_ID IS NOT NULL AND award_2.Proposal IS NOT NULL and award_2.BeginDate !='0000-00-00'";
    pool.query(query_text, function(err, result) {
        if(err) {
            console.log(err);
        }
        else {
            if(_.size(result) == 0) {
                console.log("No award to be analyzed further!!!");
                callback(analyzable_grants);
            }
            else {
                result.forEach(function(record) {
                    analyzable_grants._grantList.push(record);
                });
                console.log(_.size(analyzable_grants._grantList) + " awards returned for further analysis");
                callback(analyzable_grants);
            }
        }
    });
}

exports.award_relationship_extractor =  function award_relationship_extractor(proposal_ID, keyword_filter_array, name_filter_array, begin_date, end_date, algorithm_selection, author_correlation, aggregation, keyword_correlation, number_topics, number_keywords, threshold , myfunction){
    //GLOBAL VARIABLES
    var _stopWords=['a','able','about','above','abroad','according','accordingly','across','actually','adj','after','afterwards','again','against','ago','ahead','aint','all','allow','allows','almost','alone','along','alongside','already','also','although','always','am','amid','amidst','among','amongst','an','and','another','any','anybody','anyhow','anyone','anything','anyway','anyways','anywhere','apart','appear','appreciate','appropriate','are','arent','around','as','as','aside','ask','asking','associated','at','available','away','awfully','b','back','backward','backwards','be','became','because','become','becomes','becoming','been','before','beforehand','begin','behind','being','believe','below','beside','besides','best','better','between','beyond','both','brief','but','by','c','came','can','cannot','cant','cant','caption','cause','causes','certain','certainly','changes','clearly','cmon','co','co.','com','come','comes','concerning','consequently','consider','considering','contain','containing','contains','corresponding','could','couldnt','course','cs','currently','d','dare','darent','definitely','described','despite','did','didnt','different','directly','do','does','doesnt','doing','done','dont','down','downwards','during','e','each','edu','eg','eight','eighty','either','else','elsewhere','end','ending','enough','entirely','especially','et','etc','even','ever','evermore','every','everybody','everyone','everything','everywhere','ex','exactly','example','except','f','fairly','far','farther','few','fewer','fifth','first','five','followed','following','follows','for','forever','former','formerly','forth','forward','found','four','from','further','furthermore','g','get','gets','getting','given','gives','go','goes','going','gone','got','gotten','greetings','h','had','hadnt','half','happens','hardly','has','hasnt','have','havent','having','he','hed','hell','hello','help','hence','her','here','hereafter','hereby','herein','heres','hereupon','hers','herself','hes','hi','him','himself','his','hither','hopefully','how','howbeit','however','hundred','i','id','ie','if','ignored','ill','im','immediate','in','inasmuch','inc','inc.','indeed','indicate','indicated','indicates','inner','inside','insofar','instead','into','inward','is','isnt','it','itd','itll','its','its','itself','ive','j','just','k','keep','keeps','kept','know','known','knows','l','last','lately','later','latter','latterly','least','less','lest','let','lets','like','liked','likely','likewise','little','look','looking','looks','low','lower','ltd','m','made','mainly','make','makes','many','may','maybe','maynt','me','mean','meantime','meanwhile','merely','might','mightnt','mine','minus','miss','more','moreover','most','mostly','mr','mrs','much','must','mustnt','my','myself','n','name','namely','nd','near','nearly','necessary','need','neednt','needs','neither','never','neverf','neverless','nevertheless','new','next','nine','ninety','no','nobody','non','none','nonetheless','noone','no-one','nor','normally','not','nothing','notwithstanding','novel','now','nowhere','o','obviously','of','off','often','oh','ok','okay','old','on','once','one','ones','ones','only','onto','opposite','or','other','others','otherwise','ought','oughtnt','our','ours','ourselves','out','outside','over','overall','own','p','particular','particularly','past','per','perhaps','placed','please','plus','possible','presumably','probably','provided','provides','q','que','quite','qv','r','rather','rd','re','really','reasonably','recent','recently','regarding','regardless','regards','relatively','respectively','right','round','s','said','same','saw','say','saying','says','second','secondly','see','seeing','seem','seemed','seeming','seems','seen','self','selves','sensible','sent','serious','seriously','seven','several','shall','shant','she','shed','shell','shes','should','shouldnt','since','six','so','some','somebody','someday','somehow','someone','something','sometime','sometimes','somewhat','somewhere','soon','sorry','specified','specify','specifying','still','sub','such','sup','sure','t','take','taken','taking','tell','tends','th','than','thank','thanks','thanx','that','thatll','thats','thats','thatve','the','their','theirs','them','themselves','then','thence','there','thereafter','thereby','thered','therefore','therein','therell','therere','theres','theres','thereupon','thereve','these','they','theyd','theyll','theyre','theyve','thing','things','think','third','thirty','this','thorough','thoroughly','those','though','three','through','throughout','thru','thus','till','to','together','too','took','toward','towards','tried','tries','truly','try','trying','ts','twice','two','u','un','under','underneath','undoing','unfortunately','unless','unlike','unlikely','until','unto','up','upon','upwards','us','use','used','useful','uses','using','usually','v','value','various','versus','very','via','viz','vs','w','want','wants','was','wasnt','way','we','wed','welcome','well','well','went','were','were','werent','weve','what','whatever','whatll','whats','whatve','when','whence','whenever','where','whereafter','whereas','whereby','wherein','wheres','whereupon','wherever','whether','which','whichever','while','whilst','whither','who','whod','whoever','whole','wholl','whom','whomever','whos','whose','why','will','willing','wish','with','within','without','wonder','wont','would','wouldnt','x','y','yes','yet','you','youd','youll','your','youre','yours','yourself','yourselves','youve','z','zero'];
    var _MIN1 = 2.5
    _MIN2 = 5,
        _MAX = 50;

    var pool  = mysql.createPool({
        host		: '129.100.19.193',
        port 		: '3306',
        user		: 'arman',
        password	: 'redirection',
        database  	: 'researchmap_new2'
    });

    var analyzed_award = new Object();
    analyzed_award._id = "analyzed_award ".concat(proposal_ID);
    analyzed_award._awardProposal = proposal_ID;
    analyzed_award._awardID = -1;
    analyzed_award._awardStatus = "";
    analyzed_award._error = 0;
    analyzed_award._note = "";

    var professor_ID_list = new Array();
    var uniq_professor_ID_list = new Array();

    async.series([
            //unify parameters
            function(callback) {
                name_filter_array = _.uniq(name_filter_array);
                keyword_filter_array = _.uniq(keyword_filter_array);

                callback();
            },

            //check award status and create the object "analyzed_award"
            function(callback) {
                if(analyzed_award._error) {
                    analyzed_award._note = "Unknown error with the selected award proposal. No further analysis available at the moment.";
                    myfunction(analyzed_award);
                    return;
                }
                else {
                    var query_text = "SELECT `ID`, `Proposal`, `AwardStatus` FROM `award_2` WHERE TRIM(LEADING '0' FROM Proposal) = ".concat(proposal_ID);

                    pool.query(query_text, function(err, result) {
                        if(err) {
                            console.log(err);

                            analyzed_award._error = 1;
                            analyzed_award._note = err;
                        }
                        else {
                            var temp = new Object();

                            if(_.size(result) == 0) {
                                analyzed_award._awardID = -1;
                                analyzed_award._awardProposal = proposal_ID;
                                analyzed_award._awardStatus = "Unknown";
                                analyzed_award._error = 1;
                                analyzed_award._note = "Cannot retrieve this award proposal from the database.";
                            }
                            else if(_.size(result) == 1) {
                                analyzed_award._awardID = result[0].ID;
                                analyzed_award._awardProposal = proposal_ID;
                                analyzed_award._awardStatus = (result[0].AwardStatus == 1) ? "Accepted" : "Declined";
                            }
                            else if(_.size(result) > 1) {
                                analyzed_award._awardID = result[0].ID;
                                analyzed_award._awardProposal = proposal_ID;
                                analyzed_award._awardStatus = (result[0].AwardStatus == 1) ? "Accepted" : "Declined";
                                console.log("******************************************HUGE ERROR******************************************");
                                console.log("*** Proposal #" + proposal_ID + " returns multiple rows ***");
                                console.log("*************************************************************************************************");
                            }
                        }

                        callback();
                    });
                }
            },

            //retrieve award information
            function(callback) {
                if(analyzed_award._error) {
                    myfunction(analyzed_award);
                    return;
                }
                else {
                    var query_text = "SELECT `Title`, `Keyword`, `Abstract` FROM `award_2` WHERE `ID`=".concat(analyzed_award._awardID);

                    pool.query(query_text, function(err, result) {
                        if(err) {
                            console.log(err);

                            analyzed_award._error = 1;
                            analyzed_award._note = err;
                            /*myfunction(analyzed_award);
                             return;*/
                        }
                        else {
                            analyzed_award._title = result[0].Title;
                            analyzed_award._keyword = result[0].Keyword;
                            analyzed_award._abstract = result[0].Abstract;
                            analyzed_award._awardKeywords = new Array();
                        }

                        callback();
                    });
                }
            },

            //initialize the object and retrieve the investigators
            function(callback) {
                if(analyzed_award._error) {
                    myfunction(analyzed_award);
                    return ;
                }
                else {
                    if(analyzed_award._awardStatus) {
                        analyzed_award._note = "Accepted";
                        analyzed_award._investigatorsList = new Array();
                        analyzed_award._relatedPublicationsList = new Array();
                        analyzed_award._rejectedPublicationList = new Array();
                        analyzed_award._coAuthorsList = new Array();
                        analyzed_award._inactiveCoAuthorsList = new Array();
                        analyzed_award._addedKeywordsList = new Array();
                        analyzed_award._inactiveKeywordsList = new Array();

                        var query_text = "SELECT `Professor`, `Principal` FROM `award_professor_2` WHERE `Grant`=".concat(analyzed_award._awardID);

                        pool.query(query_text, function(err, result) {
                            if(err) {
                                console.log(err);

                                analyzed_award._error = 1;
                                analyzed_award._note = err;
                            }
                            else {
                                result.forEach(function(record) {
                                    var temp = new Object();
                                    temp._professorID = record.Professor;
                                    temp._principal = record.Principal;
                                    analyzed_award._investigatorsList.push(temp);
                                });
                            }

                            callback();
                        });
                    }
                    else {
                        analyzed_award._error = 1;
                        analyzed_award._note = "No awards were granted to this award proposal.";
                    }
                }
            },

            //retrieve the publications for the investigator(s)
            function(callback) {
                if(analyzed_award._error) {
                    myfunction(analyzed_award);
                    return ;
                }
                else {
                    if(analyzed_award._awardStatus) {
                        if(_.size(analyzed_award._investigatorsList) < 1) {
                            console.log("******************************************HUGE ERROR******************************************");
                            console.log("*************************************************************************************************");
                            analyzed_award._error = 1;
                            analyzed_award._note = "No investigators were associated with this award proposal in the database.";
                        }
                        else if(_.size(analyzed_award._investigatorsList) == 1) {
                            var investigator = analyzed_award._investigatorsList[0];

                            var query_text = "SELECT DISTINCT `publication_author_2`.`Publication`, `publication_author_2`.`Author`, `author_2`.`Professor_ID`, `publication_2`.`Year`, `publication_2`.`Title`, `publication_2`.`AuthorKeywords`, `publication_2`.`IndexKeywords`"
                                +" FROM (`publication_author_2` INNER JOIN `author_2` ON `publication_author_2`.`Author`=`author_2`.`ID`) INNER JOIN `publication_2` ON `publication_2`.ID=`publication_author_2`.`Publication`"
                                +" WHERE `publication_2`.`Year`>=".concat(begin_date).concat(" AND `publication_2`.`Year`<=").concat(end_date).concat(" AND `author_2`.`Professor_ID` =").concat(investigator._professorID);

                            pool.query(query_text, function(err, result) {
                                if(err) {
                                    console.log(err);

                                    analyzed_award._error = 1;
                                    analyzed_award._note = err;
                                }
                                else {
                                    if(_.size(result) > 0) {
                                        result.forEach(function(record) {
                                            if((record.Year >= begin_date) && (record.Year <= end_date)) {
                                                var temp = new Object();
                                                temp._publicationID = record.Publication;
                                                temp._year = record.Year;
                                                temp._title = record.Title;
                                                temp._authorKeywords = record.AuthorKeywords;
                                                temp._indexKeywords = record.IndexKeywords;
                                                temp._authors = new Array();
                                                temp._radius1 = 0;
                                                temp._radius2 = 0;
                                                temp._radius = 0;
                                                temp._active = true;

                                                analyzed_award._relatedPublicationsList.push(temp);
                                            }
                                        });
                                    }
                                    else {
                                        analyzed_award._error = 1;
                                        analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
                                    }
                                }

                                callback();
                            });
                        }
                        else if(_.size(analyzed_award._investigatorsList) > 1) {
                            var query_values = "";

                            analyzed_award._investigatorsList.forEach(function(investigator) {
                                query_values = query_values.concat(investigator._professorID).concat(" OR `author_2`.`Professor_ID`=");
                            });
                            query_values = query_values.substring(0, query_values.length - 30);

                            var query_text = "SELECT DISTINCT `publication_author_2`.`Publication`, `publication_author_2`.`Author`, `author_2`.`Professor_ID`, `publication_2`.`Year`, `publication_2`.`Title`,`publication_2`.`AuthorKeywords`, `publication_2`.`IndexKeywords`"
                                +" FROM (`publication_author_2` INNER JOIN `author_2` ON `publication_author_2`.`Author`=`author_2`.`ID`) INNER JOIN `publication_2` ON `publication_2`.ID=`publication_author_2`.`Publication`"
                                +" WHERE `publication_2`.`Year`>=".concat(begin_date).concat(" AND `publication_2`.`Year`<=").concat(end_date).concat(" AND `author_2`.`Professor_ID` =").concat(query_values);

                            pool.query(query_text, function(err, result) {
                                if(err) {
                                    console.log(err);

                                    analyzed_award._error = 1;
                                    analyzed_award._note = err;
                                }
                                else {
                                    if(_.size(result) > 0) {
                                        result.forEach(function(record) {
                                            if((record.Year >= begin_date) && (record.Year <= end_date)) {
                                                var temp = new Object();
                                                temp._publicationID = record.Publication;
                                                temp._year = record.Year;
                                                temp._title = record.Title;
                                                temp._authorKeywords = record.AuthorKeywords;
                                                temp._indexKeywords = record.IndexKeywords;
                                                temp._authors = new Array();
                                                temp._radius1 = 0;
                                                temp._radius2 = 0;
                                                temp._radius = 0;
                                                temp._active = true;

                                                analyzed_award._relatedPublicationsList.push(temp);
                                            }
                                        });
                                    }
                                    else {
                                        analyzed_award._error = 1;
                                        analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
                                    }
                                }

                                callback();
                            });
                        }
                    }
                    else {
                        analyzed_award._error = 1;
                        analyzed_award._note = "No awards were granted to this award proposal.";
                    }
                }
            },

            //check if we still have any other publications
            function(callback) {
                if(analyzed_award._error){
                    myfunction(analyzed_award);
                    return;
                }
                else {
                    if(_.size(analyzed_award._relatedPublicationsList) == 0) {
                        analyzed_award._error = 0;
                        analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
                        myfunction(analyzed_award);
                        return;
                    }
                }

                callback();
            },

            //find professor details for the authors of publications
            function(callback) {
                if(analyzed_award._error) {
                    myfunction(analyzed_award);
                    return;
                }
                else {
                    if(_.size(analyzed_award._relatedPublicationsList) > 0) {
                        analyzed_award._relatedPublicationsList.forEach(function(publication) {
                            var query_text = "SELECT `Author`, `Fullname`, `Professor_ID` FROM `publication_author_2` INNER JOIN `author_2` ON `publication_author_2`.`Author` = `author_2`.`ID` WHERE `Publication` ="
                                .concat(publication._publicationID);

                            pool.query(query_text, function(err, result) {
                                if(err) {
                                    console.log(err);
                                    analyzed_award._error = 1;
                                    analyzed_award._note = err;
                                }
                                else {
                                    if(_.size(result) > 0) {
                                        result.forEach(function(record) {
                                            var temp = new Object();
                                            temp._authorID = record.Author;
                                            temp._fullName = record.Fullname;
                                            temp._professorID = record.Professor_ID;
                                            temp._role = "non-investigator";
                                            publication._authors.push(temp);
                                        });
                                    }
                                    else {
                                        analyzed_award._error = 1;
                                        analyzed_award._note = "The investigators listed for this proposal have no publication record in our database.";
                                    }
                                }
                            });
                        });
                        _.delay(function() {
                            callback();
                        }, 250);
                    }
                    else {
                        analyzed_award._error = 1;
                        analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
                    }
                }
            },

            //check authors for being investigators
            function(callback) {
                if(analyzed_award._error) {
                    myfunction(analyzed_award);
                    return;
                }
                else {
                    if(_.size(analyzed_award._relatedPublicationsList) > 0) {
                        analyzed_award._relatedPublicationsList.forEach(function(publication) {
                            publication._authors.forEach(function(author) {
                                if(author._professorID != null) {
                                    var state = checkInvestigator(author._professorID, analyzed_award._investigatorsList);
                                    if(state._flag == true) {
                                        if(state._principal == 0) {
                                            author._role = "co-investigator";
                                        }
                                        else if(state._principal == 1) {
                                            author._role = "principal-investigator";
                                        }
                                    }
                                }
                            });
                        });

                        callback();
                    }
                    else {
                        analyzed_award._error = 1;
                        analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
                    }
                }
            },

            //calculate radius1
            function(callback) {
                if(analyzed_award._error){
                    myfunction(analyzed_award);
                    return;
                }

                if((author_correlation != 0) && (author_correlation != 1)) {
                    console.log("******************************************HUGE ERROR******************************************");
                    console.log("*************************************************************************************************");
                    analyzed_award._error = 1;
                    analyzed_award._note = "Wrong entry for the author_correlation!!!   " + author_correlation;
                }
                else {
                    if(_.size(analyzed_award._relatedPublicationsList) > 0) {
                        analyzed_award._relatedPublicationsList.forEach(function(publication) {
                            var flag = false;
                            var count = 0;

                            publication._authors.forEach(function(author) {
                                if(author._role == "principal-investigator") {
                                    flag = true;
                                }
                                if(author._role == "co-investigator") {
                                    count++;
                                }
                            });

                            if(author_correlation == 0) {
                                if(flag) {
                                    publication._radius1 = _MAX;
                                }
                                else {
                                    publication._radius1 = _MIN1;
                                }
                            }
                            else if(author_correlation == 1) {
                                if(flag) {
                                    publication._radius1 = ((count+2)/(_.size(publication._authors)+1))*50;
                                }
                                else {
                                    publication._radius1 = ((count)/(_.size(publication._authors)+1))*50;
                                }
                            }
                        });
                    }
                    else {
                        analyzed_award._error = 1;
                        analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
                    }
                }

                callback();
            },

            //extract keywords for publications
            function(callback) {
                if(analyzed_award._error){
                    myfunction(analyzed_award);
                    return;
                }
                else {
                    if(_.size(analyzed_award._relatedPublicationsList) > 0) {
                        analyzed_award._relatedPublicationsList.forEach(function(publication) {
                            //tokenize, stem and remove stop words
                            var _titleTokenized = tokenizer.tokenize(publication._title);
                            var _authorKeywordTokenized = tokenizer.tokenize(publication._authorKeywords);
                            var _indexKeywordTokenized = tokenizer.tokenize(publication._indexKeywords);
                            var _extractedKeywords = _.uniq(_titleTokenized.concat(_authorKeywordTokenized.concat(_indexKeywordTokenized)));
                            var _extractedKeywordsStopWordsRemoved = _.reject(_extractedKeywords, function(word) { return (filterItems(word.toLowerCase(), _stopWords)) });

                            publication._keywords = _extractedKeywordsStopWordsRemoved;
                        });

                        callback();
                    }
                    else {
                        analyzed_award._error = 1;
                        analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
                    }
                }
            },

            //filter publications based on "name_filter_array"
            function(callback) {
                //	(.) set the _active flag to false for the publication that has a specific co-author
                //	(.) these publications will be removed later on
                if(analyzed_award._error){
                    myfunction(analyzed_award);
                    return;
                }
                else {
                    if(_.size(name_filter_array) > 0) {
                        if(_.size(analyzed_award._relatedPublicationsList) > 0) {
                            analyzed_award._relatedPublicationsList.forEach(function(publication) {
                                name_filter_array.forEach(function(name) {
                                    publication._authors.forEach(function(author) {
                                        if(name == author._fullName) {
                                            publication._active = false;
                                            analyzed_award._inactiveCoAuthorsList.push(name);
                                        }
                                    });
                                });
                            });
                            _.delay(function() {
                                callback();
                            }, 100);
                        }
                        else {
                            analyzed_award._error = 1;
                            analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
                        }
                    }
                    else {
                        callback();
                    }
                }
            },

            //filter publications based on "keyword_filter_array"
            function(callback) {
                //	(.) set the _active flag to false for the publication that has a specific keyword
                //	(.) these publications will be removed later on
                if(analyzed_award._error){
                    myfunction(analyzed_award);
                    return;
                }
                else {
                    if(_.size(keyword_filter_array) > 0) {
                        if(_.size(analyzed_award._relatedPublicationsList) > 0) {
                            analyzed_award._relatedPublicationsList.forEach(function(publication) {
                                keyword_filter_array.forEach(function(word) {
                                    if(_.size(publication._keywords) > 0) {
                                        publication._keywords.forEach(function(keyword) {
                                            if(word == keyword) {
                                                publication._active = false;
                                                analyzed_award._inactiveKeywordsList.push(word);
                                            }
                                        });
                                    }
                                });
                            });

                            _.delay(function() {
                                callback();
                            }, 100);
                        }
                        else {
                            analyzed_award._error = 1;
                            analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
                        }
                    }
                    else {
                        callback();
                    }
                }
            },

            //just wait!
            function(callback) {
                _.delay(function() {
                    callback();
                }, 100);
            },

            //filter publications with !publication._active
            function(callback) {
                if(analyzed_award._error){
                    myfunction(analyzed_award);
                    return;
                }
                else {
                    if(_.size(analyzed_award._relatedPublicationsList) > 0) {
                        var temp = new Array();
                        analyzed_award._relatedPublicationsList.forEach(function(publication) {
                            if(publication._active) {
                                temp.push(publication);
                            }
                            else {
                                analyzed_award._rejectedPublicationList.push(publication);
                            }
                        });

                        analyzed_award._relatedPublicationsList.splice(0, _.size(analyzed_award._relatedPublicationsList));
                        analyzed_award._relatedPublicationsList = temp;

                        _.delay(function() {
                            callback();
                        }, 100);
                    }
                    else {
                        analyzed_award._error = 1;
                        analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
                    }
                }
            },

            //check if we still have any other publications
            function(callback) {
                if(analyzed_award._error){
                    myfunction(analyzed_award);
                    return;
                }
                else {
                    if(_.size(analyzed_award._relatedPublicationsList) < 1) {
                        analyzed_award._error = 0;
                        analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
                        analyzed_award._inactiveKeywordsList = keyword_filter_array;
                        var temp_list = new Array();
                        _.uniq(name_filter_array).forEach(function(name) {
                            var temp = new Object();
                            temp.name = name;
                            temp.frequency = 0;
                            temp_list.push(temp);
                        });
                        analyzed_award._coAuthorsList = temp_list;
                        analyzed_award._inactiveCoAuthorsList = temp_list;
                        myfunction(analyzed_award);
                        return;
                    }
                }

                callback();
            },

            //extract keywords and topics for award
            function(callback) {
                if(analyzed_award._error){
                    myfunction(analyzed_award);
                    return;
                }
                else {
                    //extract keywords
                    //tokenize, stem and remove stop words
                    var _titleTokenized = tokenizer.tokenize(analyzed_award._title.toLowerCase());
                    var _keywordTokenized = tokenizer.tokenize(analyzed_award._keyword.toLowerCase());
                    var _extractedKeywords = _.uniq(_titleTokenized.concat(_keywordTokenized));
                    var _extractedKeywordsStopWordsRemoved = _.reject(_extractedKeywords, function(word) {
                        return filterItems(word.toLowerCase(), _stopWords)
                    });
                    _extractedKeywordsStopWordsRemoved.forEach(function(word) {
                        word = word.toLowerCase();
                    });
                    analyzed_award._awardKeywords = _.uniq(_extractedKeywordsStopWordsRemoved);

                    //extract topics using lda
                    var award_lda_text = analyzed_award._title.concat(".").concat(analyzed_award._keyword).concat(".");
                    var award_lda_documents = award_lda_text.match( /[^\.!\?]+[\.!\?]+/g );
                    var award_lda_result = lda(award_lda_documents, number_topics, number_keywords);
                    award_lda_result.forEach(function(topic) {
                        topic.forEach(function(tuple) {
                            tuple.flag = false;
                        });
                    });
                    analyzed_award._ldaResult = award_lda_result;

                    _.delay(function() {
                        callback();
                    }, 100);
                }
            },

            //create addedKeywordsList and sort
            function(callback) {
                if(analyzed_award._error){
                    myfunction(analyzed_award);
                    return;
                }
                else {
                    if(_.size(analyzed_award._relatedPublicationsList) > 0) {
                        analyzed_award._relatedPublicationsList.forEach(function(publication) {
                            if(_.size(publication._keywords) > 0) {
                                publication._keywords.forEach(function(keyword) {
                                    if(publication._active) {
                                        var temp = new Object();
                                        temp.word = keyword.toLowerCase();
                                        temp.frequency = 0
                                        analyzed_award._addedKeywordsList.push(temp);
                                    }
                                    else {
                                        console.log("--------> HOW COME?!");
                                    }
                                });
                            }
                        });
                        _.delay(function() {}, 100);

                        analyzed_award._relatedPublicationsList.forEach(function(publication) {
                            if(_.size(publication._keywords) > 0) {
                                publication._keywords.forEach(function(keyword) {
                                    analyzed_award._addedKeywordsList.forEach(function(keyword_tuple) {
                                        if(keyword_tuple.word == keyword) {
                                            keyword_tuple.frequency++;
                                        }
                                    });
                                });
                            }
                        });
                        _.delay(function() {}, 100);

                        var temp = _.filter(analyzed_award._addedKeywordsList, function(keyword_item) {
                            var flag = false;
                            flag = ((_.isNumber(keyword_item.word)) || (_.isNumber(Number(keyword_item.word))) || (_.isNumber(parseInt(keyword_item.word))));
                            return flag;
                        });
                        _.delay(function() {}, 100);

                        //unify addedKeywordsList and add up the frequencies
                        var uniqAddedKeywordsList = new Array();
                        var uniqKeywords = _.uniq(_.pluck(analyzed_award._addedKeywordsList, 'word'));

                        uniqKeywords.forEach(function(word) {
                            var temp = new Object();
                            temp.word = word;
                            temp.frequency = 0;
                            uniqAddedKeywordsList.push(temp);
                        });

                        uniqAddedKeywordsList.forEach(function(uniq_keyword) {
                            analyzed_award._addedKeywordsList.forEach(function(keyword_tuple) {
                                if(uniq_keyword.word == keyword_tuple.word) {
                                    uniq_keyword.frequency += keyword_tuple.frequency;
                                }
                            });
                        });

                        analyzed_award._addedKeywordsList = uniqAddedKeywordsList;

                        //sort added by Arash to have the keywords ordered
                        analyzed_award._addedKeywordsList.sort(function(a,b) {return a.frequency - b.frequency;});

                        callback();
                    }
                    else {
                        analyzed_award._error = 1;
                        analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
                    }
                }
            },

            //calculate radius2
            function(callback) {
                if(analyzed_award._error){
                    myfunction(analyzed_award);
                    return;
                }
                else {
                    if(algorithm_selection == "Algorithm1") {
                        //the "Exploration" algorithm
                        //	(.) returns all the possible matches of publications for the group of investigators
                        //	(.) allows the user to explor the cross-referenced publications
                        //	(.) for the publications that have no keywords matched, returns _MIN1 as _radius2
                        //	(.) for the publications that have some keywords matched, calculates _radius2 according to keyword_correlation
                        if(_.size(analyzed_award._relatedPublicationsList) > 0) {
                            analyzed_award._relatedPublicationsList.forEach(function(publication) {
                                var match_count = 0;

                                if((_.size(publication._keywords) > 0) && (publication._active)) {
                                    publication._keywords.forEach(function(publication_keyword) {
                                        analyzed_award._awardKeywords.forEach(function(award_keyword) {
                                            if((publication_keyword.toLowerCase() == award_keyword.toLowerCase()) ||
                                                (natural.PorterStemmer.stem(publication_keyword.toLowerCase()) == natural.PorterStemmer.stem(award_keyword.toLowerCase()))) {
                                                match_count++;
                                            }
                                        });
                                    });
                                }

                                var weight = ((match_count) / (Math.min(_.size(publication._keywords), _.size(analyzed_award._awardKeywords))));

                                //if no keyword match exists
                                if(weight <= 0) {
                                    publication._radius2 = _MIN1;
                                    publication._radius1 = _MIN1;
                                }
                                else {
                                    if(keyword_correlation == 0) {
                                        //// ***SIMPLE LINEAR THRESHOLDING***
                                        if(weight >= (4*threshold)) {
                                            publication._radius2 = weight * 50;
                                        }
                                        else {
                                            publication._radius2 = _MIN2;
                                            publication._radius1 = _MIN2;
                                        }
                                    }
                                    else if(keyword_correlation == 1) {
                                        //// ***SIGMOID THRESHOLDING***
                                        var temp = 50 * ((2 * (1.01 - (4*threshold))) * sigmoid(weight - (4*threshold)));
                                        publication._radius2 = (temp > 50) ? 50 : temp;
                                    }

                                }
                            });

                            callback();
                        }
                        else {
                            analyzed_award._error = 1;
                            analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";


                            callback();
                            /*myfunction(analyzed_award);
                             return;*/
                        }

                    }
                    else if(algorithm_selection == "Algorithm2") {
                        //the "Keyword Matching" algorithm
                        //	(.) calculates _radius2 according to keyword_correlation
                        if(_.size(analyzed_award._relatedPublicationsList) > 0) {
                            analyzed_award._relatedPublicationsList.forEach(function(publication) {
                                var match_count = 0;

                                if((_.size(publication._keywords) > 0) && (publication._active)) {
                                    publication._keywords.forEach(function(publication_keyword) {
                                        analyzed_award._awardKeywords.forEach(function(award_keyword) {
                                            if((publication_keyword.toLowerCase() == award_keyword.toLowerCase()) ||
                                                (natural.PorterStemmer.stem(publication_keyword.toLowerCase()) == natural.PorterStemmer.stem(award_keyword.toLowerCase()))) {
                                                match_count++;
                                            }
                                        });
                                    });
                                }

                                var weight = ((match_count) / (Math.min(_.size(publication._keywords), _.size(analyzed_award._awardKeywords))));

                                //if no keyword match exists
                                if(weight <= 0) {
                                    publication._radius2 = 0;
                                    publication._radius1 = _MIN1;
                                }
                                else {
                                    if(keyword_correlation == 0) {
                                        //// ***SIMPLE LINEAR THRESHOLDING***
                                        if(weight >= threshold) {
                                            publication._radius2 = weight * 50;
                                        }
                                        else {
                                            publication._radius2 = _MIN2;
                                            publication._radius1 = _MIN2;
                                        }
                                    }
                                    else if(keyword_correlation == 1) {
                                        //// ***SIGMOID THRESHOLDING***
                                        var temp = 50 * ((2 * (1.01 - (4*threshold))) * sigmoid(weight - (4*threshold)));
                                        publication._radius2 = (temp > 50) ? 50 : temp;
                                    }

                                }
                            });

                            callback();
                        }
                        else {
                            analyzed_award._error = 1;
                            analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";

                            callback();
                            /*myfunction(analyzed_award);
                             return;*/
                        }
                    }
                    else if(algorithm_selection == "Algorithm3") {
                        //the "Topic Modelling" algorithm
                        //	(.) extracts topics for each publication
                        //	(.) performs a cross referencing on the topics for the award and the topics extracted for each publication and returns a weight(i.e. _radius2) accordingly
                        if(_.size(analyzed_award._relatedPublicationsList) > 0) {
                            analyzed_award._relatedPublicationsList.forEach(function(publication) {
                                if(publication._active) {
                                    //use lda to extract topics for each publication
                                    var publication_lda_text = publication._title.concat(".");
                                    if(_.size(publication._keywords) > 0) {
                                        var keywordsListed = ".";
                                        publication._keywords.forEach(function(keyword) {
                                            keywordsListed = keywordsListed.concat(keyword).concat(".");
                                        });
                                        publication_lda_text = publication_lda_text.concat(keywordsListed).concat(".");
                                    }
                                    _.delay(function() {}, 100);
                                    var publication_lda_documents = publication_lda_text.match( /[^\.!\?]+[\.!\?]+/g );
                                    var publication_lda_result = lda(publication_lda_documents, number_topics, number_keywords);

                                    publication._ldaResult = publication_lda_result;
                                }
                            });

                            analyzed_award._relatedPublicationsList.forEach(function(publication) {
                                if(publication._active) {
                                    publication._ldaResult.forEach(function(topic) {
                                        topic.forEach(function(tuple) {
                                            tuple.flag = false;
                                        });
                                    });
                                }
                            });

                            var match_count = 0;

                            //// CURRENTLY WE ONLY USE THE FIRST TOPIC
                            if(_.size(analyzed_award._ldaResult) > 0) {
                                analyzed_award._relatedPublicationsList.forEach(function(publication) {
                                    if((_.size(publication._ldaResult) > 0) && (publication._active)) {
                                        analyzed_award._ldaResult[0].forEach(function(award_tuple) {
                                            publication._ldaResult[0].forEach(function(publication_tuple) {
                                                if(award_tuple.term == publication_tuple.term) {
                                                    award_tuple.flag = true;
                                                    publication_tuple.flag = true;
                                                }
                                            });
                                        });

                                        //calculate the summation of probabilities for this topic of the award
                                        var award_total_probability = 0;
                                        analyzed_award._ldaResult[0].forEach(function(award_tuple) {
                                            award_total_probability += award_tuple.probability;
                                        });

                                        //calculate the summation of probabilities for this topic of the publication
                                        var publication_total_probability = 0;
                                        publication._ldaResult[0].forEach(function(publication_tuple) {
                                            publication_total_probability += publication_tuple.probability;
                                        });

                                        //calculate the summation of matched probabilities for this topic of the award
                                        var award_matched_probability = 0;
                                        analyzed_award._ldaResult[0].forEach(function(award_tuple) {
                                            if(award_tuple.flag) {
                                                award_matched_probability += award_tuple.probability;
                                            }
                                        });

                                        //calculate the summation of matched probabilities for this topic of the publication
                                        var publication_matched_probability = 0;
                                        publication._ldaResult[0].forEach(function(publication_tuple) {
                                            if(publication_tuple.flag) {
                                                publication_matched_probability += publication_tuple.probability;
                                            }
                                        });

                                        //// TODO: WE ARE CURRENTLY USING THE GEOMETRIC MEAN, BUT MIGHT ADD OTHER TYPES OF MEAN LATER (arithmetic, harmonic, etc)
                                        ////	MAX SHOULD BE = 50 * 1, WHERE ALL TOPICS ARE MATCHED IN BOTH
                                        if((award_matched_probability > 0) && (publication_matched_probability > 0)) {
                                            publication._radius2 = 50 * Math.sqrt((award_matched_probability / award_total_probability) * (publication_matched_probability / publication_total_probability));
                                        }
                                        else {
                                            publication._radius2 = _MIN1;
                                            publication.active = false;
                                        }

                                    }
                                    else {
                                        publication._radius2 = _MIN1;
                                        publication._active = false;
                                    }
                                });
                            }
                            else {
                                analyzed_award._error = 1;
                                analyzed_award._note = "No topics could be extracted for the selected award.";
                                analyzed_award._relatedPublicationsList.forEach(function(publication) {
                                    publication._active = false;
                                });
                                /*myfunction(analyzed_award);
                                 return;*/
                            }

                            callback();
                        }
                        else {
                            analyzed_award._error = 1;
                            analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";

                            callback();
                            /*myfunction(analyzed_award);
                             return;*/
                        }

                    }
                    else {
                        console.log("******************************************HUGE ERROR******************************************");
                        console.log("*************************************************************************************************");
                        analyzed_award._error = 1;
                        analyzed_award._note = "Wrong entry for the algorithm!!!   " + algorithm_selection;
                    }
                }
            },

            //calculate radius
            function(callback) {
                if(analyzed_award._error){
                    console.log("analyzed award has an error: " + analyzed_award._note);
                    myfunction(analyzed_award);
                    return;
                }
                else {
                    if((aggregation != 0) && aggregation != 1) {
                        console.log("******************************************HUGE ERROR******************************************");
                        console.log("*************************************************************************************************");
                        analyzed_award._error = 1;
                        analyzed_award._note = "Wrong entry for the aggregation!!!   " + aggregation;
                    }
                    else {
                        if(_.size(analyzed_award._relatedPublicationsList) > 0) {
                            analyzed_award._relatedPublicationsList.forEach(function(publication) {
                                if(aggregation == 0) {
                                    //UNIFORM/SIMPLE ARITHMETIC MEAN
                                    publication._radius = (publication._radius1 + publication._radius2);
                                }
                                else if(aggregation == 1) {
                                    //WEIGHTED ARITHMETIC MEAN
                                    var author_count = _.size(publication._authors);
                                    var keywords_count = _.size(publication._keywords);

                                    var weight1 = author_count / (author_count + keywords_count);
                                    var weight2 = keywords_count / (author_count + keywords_count);

                                    publication._radius = (weight1 * publication._radius1) + (weight2 * publication._radius2);
                                }
                            });
                        }
                        else {
                            analyzed_award._error = 1;
                            analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
                        }
                    }

                    callback();
                }
            },

            //filter publications with !publication._active
            function(callback) {
                if(analyzed_award._error){
                    myfunction(analyzed_award);
                    return;
                }
                else {
                    if(_.size(analyzed_award._relatedPublicationsList) > 0) {
                        var temp = new Array();
                        analyzed_award._relatedPublicationsList.forEach(function(publication) {
                            if(publication._active) {
                                temp.push(publication);
                            }
                            else {
                                analyzed_award._rejectedPublicationList.push(publication);
                            }
                        });

                        analyzed_award._relatedPublicationsList.splice(0, _.size(analyzed_award._relatedPublicationsList));
                        analyzed_award._relatedPublicationsList = temp;

                        _.delay(function() {
                            callback();
                        }, 100);
                    }
                    else {
                        analyzed_award._error = 1;
                        analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
                    }
                }
            },

            //check if we still have any other publications
            function(callback) {
                if(analyzed_award._error){
                    myfunction(analyzed_award);
                    return;
                }
                else {
                    if(_.size(analyzed_award._relatedPublicationsList) < 1) {
                        analyzed_award._error = 0;
                        analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
                        analyzed_award._inactiveKeywordsList = keyword_filter_array;
                        var temp_list = new Array();
                        _.uniq(name_filter_array).forEach(function(name) {
                            var temp = new Object();
                            temp.name = name;
                            temp.frequency = 0;
                            temp_list.push(temp);
                        });
                        analyzed_award._coAuthorsList = temp_list;
                        analyzed_award._inactiveCoAuthorsList = temp_list;
                        myfunction(analyzed_award);
                        return;
                    }
                }

                callback();
            },

            //create final list of co-authors
            function(callback) {
                if(analyzed_award._error){
                    myfunction(analyzed_award);
                    return;
                }
                else {
                    var coAuthorNames = new Array();
                    var coAuthorList = new Array();

                    if(_.size(analyzed_award._relatedPublicationsList) > 0) {
                        analyzed_award._relatedPublicationsList.forEach(function(publication) {
                            if(publication._active) {
                                publication._authors.forEach(function(author) {
                                    coAuthorNames.push(author._fullName);
                                });
                            }
                            else {
                                console.log("--------> HOW COME?!");
                            }
                        });

                        coAuthorNames = _.uniq(coAuthorNames);
                        coAuthorNames.forEach(function(name) {
                            var temp = new Object();
                            temp.name = name;
                            temp.frequency = 0;
                            coAuthorList.push(temp);
                        });
                        _.delay(function() {}, 100);

                        analyzed_award._relatedPublicationsList.forEach(function(publication) {
                            if(publication._active) {
                                publication._authors.forEach(function(author) {
                                    coAuthorList.forEach(function(coAuthor) {
                                        if(author._fullName == coAuthor.name) {
                                            coAuthor.frequency++;
                                        }
                                    });
                                });
                            }
                            else {
                                console.log("--------> HOW COME?!");
                            }
                        });

                        var tempCoAuthorList = _.uniq(analyzed_award._inactiveCoAuthorsList);
                        var inactiveCoAuthorList = new Array();
                        tempCoAuthorList.forEach(function(tempCoAuthor) {
                            var temp = new Object();
                            temp.name = tempCoAuthor;
                            temp.frequency = 0;
                            inactiveCoAuthorList.push(temp);
                        });
                        analyzed_award._coAuthorsList = coAuthorList.concat(inactiveCoAuthorList);
                        analyzed_award._inactiveCoAuthorsList = inactiveCoAuthorList;

                        analyzed_award._coAuthorsList.sort(function(a,b) {return a.frequency - b.frequency;});

                        _.delay(function() {
                            callback();
                        }, 100);
                    }
                    else {
                        analyzed_award._error = 1;
                        analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
                    }
                }
            },

            //unify _inactiveKeywordsList and add to the end of addedKeywordsList
            function(callback) {
                analyzed_award._inactiveKeywordsList = _.uniq(analyzed_award._inactiveKeywordsList);

                callback();
            }
        ],
        function(err, results) {
            if(analyzed_award._error){
                myfunction(analyzed_award);
                return;
            }

            if(err) {
                console.log(err);
                analyzed_award._error = 1;
                analyzed_award._note = "Async.js error";
                myfunction(analyzed_award);
                return;
            }
            else {
                myfunction(analyzed_award);
                return;
            }
        });
}
