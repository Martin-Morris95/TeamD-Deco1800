<?php
    $markers = simplexml_load_file("../XML/markers.xml");
    echo json_encode($markers);
?>