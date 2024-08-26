import IconXls from "@/assets/js/IconXls";
import { Button } from "@nextui-org/react";
import moment from "moment";
import React from "react";
import XlsExport from "xlsexport";

const ExportExcel = ({ data = [], columns, footerCells = []}) => {
    let filteredData = data.map((item) => {
        const filteredItem = {};
        columns.forEach((column) => {
            if(column.type == "date"){
                filteredItem[column.name] = item[column.uid] == null || item[column.uid] == "" ? '-': moment(item[column.uid]).format("DD/MM/YYYY hh:mm a")
            }else{
                filteredItem[column.name] = item[column.uid];
                
            }
        });
        // filteredData.push()
        return filteredItem;
    });
    if(footerCells.length > 0 ){
        footerCells.map(footer => filteredData.push(footer))
    }    
    console.log(filteredData)
    

    const xls = new XlsExport(filteredData, "excel Sheet");

    return <Button onClick={() => xls.exportToXLS('export.xls')} color="primary" variant='bordered' className='w-100' size='md' endContent={<IconXls />}>
        Download
    </Button>
};

export default ExportExcel;
