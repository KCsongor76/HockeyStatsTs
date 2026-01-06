import React from 'react';
import Button from "../components/Button";
import {useNavigate} from "react-router-dom";

const EditTeamPage = () => {

    const navigate = useNavigate();

    const submitHandler = () => {
    }

    return (
        <form onSubmit={submitHandler}>
            {/*  name  */}
            {/*  optional logo  */}
            {/*  home colors  */}
            {/*  ExampleIcon  */}
            {/*  away colors  */}
            {/*  ExampleIcon  */}
            {/*  championships  */}
            <Button styleType={"positive"} type={"submit"}>Save Changes</Button>
            <Button styleType={"negative"} onClick={() => navigate(-1)}>Go back</Button>

        </form>
    );
};

export default EditTeamPage;