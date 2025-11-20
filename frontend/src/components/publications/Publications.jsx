import React from "react";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getPublications } from "../../actions/publicationsAction";
import { ToastContainer, toast } from "react-toastify";
import { RingLoader } from "react-spinners";
import Publication from "./Publication";
import Pagination from "react-js-pagination";
import { useState } from "react";
import MetaData from "../structure/MetaData";
import NoPublicationsImage from "../../images/NotFoundImage.jpg";
import "./Publications.scss";
import { BiSolidCategory } from "react-icons/bi";
import Slider from "@mui/material-next/Slider";
import { RiDoubleQuotesR } from "react-icons/ri";
import { BsCalendarMonth } from "react-icons/bs";
import { MdCalendarMonth } from "react-icons/md";
import { utils, writeFile } from "xlsx";
import { BsFilterLeft } from "react-icons/bs";
import { FaWindowClose } from "react-icons/fa";
const categories = ["Journal", "Book", "Conference", "Patent", "Copyright"];
const Publications = () => {
  const { keyword } = useParams();
  const dispatch = useDispatch();
  const [value, setValue] = useState([0, 100000]);
  const [ppp, setPpp] = useState(10);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  let years = [];
  for (let i = 0; i < 50; i++) {
    years.push(currentYear - i);
  }
  const months = [
    "January",
    "Febrauary",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const {
    publications,
    error,
    loading,
    publicationsCount,
    resultPerPage,
    filteredPublicationsCount,
    totalPublications,
  } = useSelector((state) => state.userPublications);
  const [currentPage, setCurrentPageNo] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState(categories);
  const departments = ["IT", "CSE", "ECE", "EEE", "EIE"];

  const [selectedDepartments, setSelectedDepartments] = useState(departments);
  const [fYear, setFYear] = useState("1970");
  const [tYear, setTYear] = useState("");
  const [fMonth, setFMonth] = useState("");
  const [eMonth, setEMonth] = useState("s");
  const [foc, setFoc] = useState(false);
  const handleCheckboxChange = (category) => {
    setSelectedCategories((prevSelected) => {
      // Toggling the category's presence in the array
      const newSelected = prevSelected.includes(category)
        ? prevSelected.filter((cat) => cat !== category)
        : [...prevSelected, category];
      return newSelected;
    });
  };
  const handleCheckboxChangeDep = (department) => {
    setSelectedDepartments((prevSelected) => {
      // Toggling the department's presence in the array
      const newSelected = prevSelected.includes(department)
        ? prevSelected.filter((dept) => dept !== department)
        : [...prevSelected, department];
      return newSelected;
    });
  };
  console.log(keyword)
  useEffect(() => {
    if (error) {
      toast.error(error, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      dispatch({ type: "CLEAR_ERRORS" });
    }
    dispatch(
      getPublications(
        keyword,
        currentPage,
        selectedCategories,
        selectedDepartments,
        value,
        setValue,
        ppp,
        fYear,
        tYear,
        fMonth,
        eMonth,
        currentYear
      )
    );
  }, [dispatch, error,currentPage]);
  const downloadAsWorkbook = () => {
    const ws = utils.json_to_sheet(totalPublications);
    /* create workbook and append worksheet */
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "publications");
    /* export to XLSX */
    writeFile(wb, "Publications.xlsx");
  };
  return loading ? (
    <div className="loader">
      <RingLoader color="tomato" size="10vmax" />
    </div>
  ) : (
    <div className="publicationsD">
      <MetaData title={`Publications`} />

      {/* <div className="publications-display"> */}
      <div className="main-display">
        <div
          className={`filterBox ${foc ? "f-b-open" : "f-b-close"}`}
          onClick={() => setCurrentPageNo(1)}
        >
          <FaWindowClose className="close" onClick={() => setFoc(!foc)} />
          <div style={{textAlign:"center",fontWeight:"bolder"}}>
            Publications Per Page
            <input
              type="text"
              value={ppp}
              onChange={(event) => setPpp(event.target.value)}
              id="publications-per-page"
              placeholder="publications per page"
              title="type number and click on enter "
            />
          </div>
          <div className="line"></div>
          <div className="categoryBox">
            <div className="categories">
              <BiSolidCategory />
              Departments
            </div>
            {departments.map((department) => (
              <div key={department} className="category">
                <input
                  type="checkbox"
                  checked={selectedDepartments.includes(department)}
                  onChange={() => handleCheckboxChangeDep(department)}
                />
                {department}
              </div>
            ))}
            <div className="line"></div>

            <div className="categories">
              <BiSolidCategory />
              Categories
            </div>
            {categories.map((category) => (
              <div className="category">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={() => handleCheckboxChange(category)}
                />
                {category}
              </div>
            ))}
          </div>
          <div className="line"></div>
          <div className="cRange">
            <p>
              <RiDoubleQuotesR />
              Citations
            </p>
            <Slider
              value={value}
              min={0}
              max={100000}
              valueLabelDisplay="on"
              onChange={handleChange}
            />
            <div className="line"></div>
            <div className="year">
              <div className=" year-filter" style={{ marginTop: "1vmax" }}>
                {" "}
                <div className="categories" style={{ flexDirection: "row" }}>
                  {" "}
                  <MdCalendarMonth /> Date
                </div>
                <div className="fty" style={{ textAlign: "center" }}>
                  <input
                    type="date"
                    className="date-filter from"
                    onChange={(event) => setFYear(event.target.value)}
                    value={fYear}
                    placeholder="from"
                  />
                  -
                  <input
                    type="date"
                    className="date-filter to"
                    onChange={(event) => {
                      // console.log(event.target.value)
                      setTYear(event.target.value);
                    }}
                    value={tYear}
                  />
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              dispatch(
                getPublications(
                  keyword,
                  currentPage,
                  selectedCategories,
                  selectedDepartments,
                  value,
                  setValue,
                  ppp,
                  fYear,
                  tYear,
                  fMonth,
                  eMonth,
                  currentYear
                )
              );
            }}
            className="apply"
          >
            Apply
          </button>
        </div>
        <div className="publications">
          <p>Publications</p>
          <div className="b-filter">
            <div
              className="total-publications"
              style={{ backgroundColor: "unset" }}
            >
              <BsFilterLeft
                className="filter-side"
                onClick={() => setFoc(!foc)}
              />
              <b>{selectedCategories.join(",")}</b>
              {`(${ppp * (currentPage - 1) + 1}-${
                currentPage * ppp
              } publications from total ${filteredPublicationsCount} publications)`}
            </div>
            <div style={{ marginRight: "1vmax" }}>
              <div className="down">
                <button onClick={downloadAsWorkbook} className="download-excel">
                  Download
                </button>
                <span>Download all publications as a excel sheet</span>
              </div>
            </div>
          </div>
          {!(keyword==undefined)&&<b>search:{keyword}</b>}
          <div className="line" style={{ width: "74vw" }}></div>
          {publications && filteredPublicationsCount != 0 ? (
            publications.map((ele, idx) => {
              return <Publication key={ele._id} pub={ele} index={idx} />;
            })
          ) : (
            <div className="no-results">
              <img src={NoPublicationsImage} alt="" />
              <p>NO PUBLICATIONS FOUND</p>
            </div>
          )}
          {resultPerPage < filteredPublicationsCount ? (
            <div className="paginationBox">
              <Pagination
                activePage={currentPage}
                itemsCountPerPage={resultPerPage}
                totalItemsCount={filteredPublicationsCount}
                onChange={setCurrentPageNo}
                nextPageText="Next"
                prevPageText="Prev"
                firstPageText="1st"
                lastPageText="Last"
                itemClass="page-item"
                linkClass="page-link"
                activeClass="pageItemActive"
                activeLinkClass="pageLinkActive"
              />
            </div>
          ) : null}
        </div>
      </div>
      {/* </div> */}

      <ToastContainer />
    </div>
  );
};

export default Publications;
